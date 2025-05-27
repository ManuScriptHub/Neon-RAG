from services.text_extractor import extract_text
from services.chunking import chunking
from controllers.document_chunk import create_document_chunk
from controllers.corpora import create_corpus_data
from controllers.documents import create_document_data
from services.llm_services import llm_service
from services.embedding import get_pgrag_embedding_for_passage
import json
from psycopg2.extras import Json
from fastapi import HTTPException
from core.db import settings as db_settings

def get_tag_prompt(text: str):
     return f'''
    SYSTEM MESSAGE:
    "You are an expert AI text analyzer. Your job is to parse the given text and produce structured JSON metadata."

    USER MESSAGE:

    TEXT:
    {text}

    TASK:
    Please analyze the above TEXT and return a structured JSON with these fields:

    1) main_topic: A single string representing the overall topic or category of the text.
    2) keywords: A list of short relevant keywords or key phrases.
    3) named_entities:
    - people: A list of any people mentioned.
    - organizations: A list of any organizations mentioned.
    - locations: A list of any places or geographic references.
    - dates: A list of any specific dates or times referenced.
    4) sentiment: The overall tone (e.g., positive, negative, neutral).
    5) summary: A concise summary of the main point(s) from the text.
    6) key_points: A list of the most important bullet-style points.
    7) related_questions: Questions a reader might ask after reading.
    8) more_info: Suggestions or resources that might provide additional context.
    9) domain_specific: (Optional) Relevant domain(s) or subdomains (e.g., "Healthcare," "Finance," "Technology").

    Return the response as valid JSON without any extra commentary or markdown. That is, only JSON, nothing else.


    EXAMPLE OUTPUT JSON (data types only):
    {{
  "main_topic": "string",
  "keywords": [
    "string"
  ],
  "named_entities": {{
    "people": ["string"],
    "organizations": ["string"],
    "locations": ["string"],
    "dates": ["string"]
  }},
  "sentiment": "string",
  "summary": "string",
  "key_points": [
    "string"
  ],
  "related_questions": [
    "string"
  ],
  "more_info": [
    "string"
  ],
  "domain_specific": [
    "string"
  ]
}}
Note: Important: Return only valid JSON and no extra text, commentary, or formatting. Return nothing else.
'''


def process_document(userId, file_type, document_bytes_or_url, corpus_key, file_name):
    try:
        # Extract text using pgRAG's text extraction capabilities
        extracted_text = extract_text(file_type, document_bytes_or_url)
        
        # Generate document tags using LLM
        prompt = get_tag_prompt(extracted_text)
        raw_response = llm_service(prompt, model="gpt-4.1-mini", return_full_response=True)
        if not raw_response:
            print("LLM service returned empty response")
            raise RuntimeError("Empty response from LLM service")

        if isinstance(raw_response, dict) and raw_response.get("choices"):
            content = raw_response["choices"][0]["message"].get("content", "")
            cleaned = content.strip().strip('```').strip()
            try:
                document_tags = json.loads(cleaned)
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON from LLM content: {e}\n>>{cleaned}")
                raise RuntimeError(f"Invalid JSON in LLM response: {cleaned}")
        elif isinstance(raw_response, str):
            # fallback if you ever get just a raw string
            cleaned = raw_response.strip().strip('```').strip()
            try:
                document_tags = json.loads(cleaned)
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON: {e}")
                raise RuntimeError(f"Invalid JSON response from LLM service: {cleaned}")
        else:
            raise RuntimeError(f"Unexpected LLM response format: {type(raw_response)}")


        # Chunk text using pgRAG's chunking capabilities
        chunked_text = chunking({
            "text": extracted_text, 
            "chunk_type": "manual", 
            "chunk_size": 1000, 
            "chunk_overlap": 100, 
            "model": "llama-3.3-70b-versatile"
        })
        
        document_id = f"{file_type}|{file_name}"
        document_data = {}
        
        if userId and corpus_key:
            # Create or fetch corpus
            corpora_result = create_corpus_data({
                "userId": userId,
                "corpusKey": corpus_key
            })
            if not corpora_result or not corpora_result.get("results"):
                raise HTTPException(status_code=500, detail="Failed to create or fetch corpus")

            first_corpus = corpora_result["results"][0] if isinstance(corpora_result["results"], list) and corpora_result["results"] else None
            if not first_corpus or not first_corpus.get("corpusId"):
                raise HTTPException(status_code=500, detail="CorpusId missing in corpus result")

            corpus_id = first_corpus["corpusId"]

            # Create document
            document_data["userId"] = userId
            document_data["corpusId"] = corpus_id
            document_data["fulltext"] = extracted_text  # Changed from rawText to fulltext to match new schema
            document_data["docType"] = file_type
            document_data["docName"] = file_name
            document_data["documentId"] = document_id
            if file_type == "url":
                document_data["sourceUrl"] = f"{file_name}"
                
            document_result = create_document_data(document_data)
            if not document_result or not document_result.get("results"):
                raise HTTPException(status_code=500, detail="Failed to create document")

        # Process chunks and generate embeddings
        chunks_results = []
        for chunk in chunked_text:
            chunk_data = {}
            chunk_data["chunkIndex"] = chunk["chunk_number"]
            chunk_data["chunkText"] = chunk["content"]
            chunk_data["documentId"] = document_id
            chunk_data["metaData"] = Json(document_tags)
            
            # Generate embedding using pgRAG
            try:
                embedding = get_pgrag_embedding_for_passage(chunk["content"])
                chunk_data["embeddingData"] = embedding
            except Exception as e:
                print(f"Failed to generate embedding with pgRAG: {e}")
                # Continue without embedding if it fails
            
            result = create_document_chunk(chunk_data)
            if not result or not result.get("results"):
                raise HTTPException(status_code=500, detail="Failed to create document chunk")
            
            # Handle both cases: when results is a list or a single item
            if isinstance(result["results"], list):
                chunks_results.extend(result["results"])
            else:
                chunks_results.append(result["results"])
  
        return {"results": chunks_results}
    except Exception as e:
        print(f"Error in process_document: {str(e)}")
        raise HTTPException(status_code=401, detail=f"{e}")
