from services.llm_services import llm_service
import json
from core.db import settings

def chunking(data: dict):
    try:
        context = data.get("text", "")
        if not context:
            raise ValueError("Context text is required.")

        chunk_type = data.get("chunk_type", "manual")
        conn = settings.get_db_connection()
        
        try:
            cur = conn.cursor()
            
            if chunk_type == "auto":
                model = data.get("model")
                if not model:
                    raise ValueError("Model is required for LLM-based chunking.")

                prompt = f"""Split the following text into chunks of approximately 200–300 words each. Each chunk should be numbered sequentially starting from 1. The output must be returned as a structured JSON array in the following format:

                [
                  {{
                    "chunk_number": 1,
                    "content": "First chunk of the text here..."
                  }},
                  {{
                    "chunk_number": 2,
                    "content": "Second chunk of the text here..."
                  }}
                ]

                Make sure:
                - Chunks do NOT break sentences mid-way.
                - Logical flow is preserved.
                - No extra commentary—just the raw JSON output.

                Text: {context}
                """

                response = llm_service(prompt, model, context)

                if not response or not response.strip():
                    raise ValueError("LLM returned an empty response.")

                try:
                    parsed_response = json.loads(response)
                    return parsed_response
                except json.JSONDecodeError:
                    raise ValueError(f"Invalid JSON from LLM: {response}")

            elif chunk_type == "manual":
                chunk_size = data.get("chunk_size", 1000)
                chunk_overlap = data.get("chunk_overlap", 100)

                if chunk_size is None or chunk_size <= 0:
                    raise ValueError("Chunk size must be provided and greater than zero for manual chunking.")
                
                # Use pgRAG's chunking by token count
                try:
                    # First try token-based chunking
                    query = "SELECT unnest(rag_bge_small_en_v15.chunks_by_token_count(%s, %s, %s));"
                    cur.execute(query, (context, chunk_size // 4, chunk_overlap // 4))  # Approximate tokens from characters
                    chunks = [row[0] for row in cur.fetchall()]
                    
                    if not chunks:
                        # Fallback to character-based chunking
                        query = "SELECT unnest(rag.chunks_by_character_count(%s, %s, %s));"
                        cur.execute(query, (context, chunk_size, chunk_overlap))
                        chunks = [row[0] for row in cur.fetchall()]
                    
                    return [{"chunk_number": i + 1, "content": chunk} for i, chunk in enumerate(chunks)]
                    
                except Exception as e:
                    print(f"pgRAG chunking failed: {str(e)}")
                    # Fallback to original implementation if pgRAG chunking fails
                    words = context.split()
                    chunks = []
                    start = 0

                    while start < len(words):
                        end = start + chunk_size
                        chunk_words = words[start:end]
                        chunk_text = " ".join(chunk_words)
                        chunks.append(chunk_text)

                        # Move start forward, allowing for overlap
                        start = end - chunk_overlap if end - chunk_overlap > start else end

                    return [{"chunk_number": i + 1, "content": chunk} for i, chunk in enumerate(chunks)]

            else:
                raise ValueError("Invalid chunk_type. Must be 'auto' or 'manual'.")
                
        finally:
            if conn:
                conn.close()

    except Exception as e:
        raise ValueError(f"An error occurred during chunking: {str(e)}")
