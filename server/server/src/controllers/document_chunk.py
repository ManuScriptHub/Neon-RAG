from models.document_chunk import DocumentChunkModel
from services.embedding import get_embedding, get_pgrag_embedding_for_passage, get_pgrag_embedding_for_query
from services.llm_services import llm_service
from services.reranker import re_rank
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

documents_data = DocumentChunkModel()

def get_documents_chunks(where_conditions=None):
    response = documents_data.get_document_chunks(where_conditions)
    
    if "error" in response:
        status_code = response.get("status_code", 500)
        raise HTTPException(status_code=status_code, detail=response["error"])
    

    if "results" in response and not isinstance(response["results"], list):
        response["results"] = [response["results"]] if response["results"] is not None else []
    
    return response

def get_document_chunk(chunk_id):
    response = documents_data.get_document_chunk(chunk_id)
    
    if "error" in response:
        status_code = response.get("status_code", 500)
        raise HTTPException(status_code=status_code, detail=response["error"])
    
    if not response or not response.get("results"):
        raise HTTPException(status_code=404, detail=f"Document chunk with ID {chunk_id} not found")

    if "results" in response and not isinstance(response["results"], list):
        response["results"] = [response["results"]] if response["results"] is not None else []
    
    return response

def create_document_chunk(chunk_input_data):
    try:
        
        if not chunk_input_data:
            raise HTTPException(status_code=400, detail="Chunk data is required")
            
        if "chunkText" not in chunk_input_data or not chunk_input_data["chunkText"]:
            raise HTTPException(status_code=400, detail="Chunk text is required")
            
        if "documentId" not in chunk_input_data or not chunk_input_data["documentId"]:
            raise HTTPException(status_code=400, detail="Document ID is required")
            
        try:

            if "embeddingData" not in chunk_input_data:
                # first try with pgRAG
                try:
                    chunk_input_data["embeddingData"] = get_pgrag_embedding_for_passage(chunk_input_data["chunkText"])
                    logger.info("Generated embedding using pgRAG")
                except Exception as e:
                    logger.warning(f"pgRAG embedding failed, falling back to Voyage: {e}")
                    # fallback to Voyage
                    chunk_input_data["embeddingData"] = get_embedding("voyage-3-large", [chunk_input_data["chunkText"]])[0]
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")
        
        response = documents_data.create_document_chunk(chunk_input_data)
        
        if "error" in response:
            status_code = response.get("status_code", 500)
            raise HTTPException(status_code=status_code, detail=response["error"])
        

        if "results" in response and not isinstance(response["results"], list):
            response["results"] = [response["results"]] if response["results"] is not None else []
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_document_chunk: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create document chunk: {str(e)}")

def update_document_chunk(chunk_id, chunk_input_data):
    if not chunk_id:
        raise HTTPException(status_code=400, detail="Chunk ID is required")
        
    if not chunk_input_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
    
    response = documents_data.update_document_chunk(chunk_id, chunk_input_data)
    
    if "error" in response:
        status_code = response.get("status_code", 500)
        raise HTTPException(status_code=status_code, detail=response["error"])
    
    if "results" in response and not isinstance(response["results"], list):
        response["results"] = [response["results"]] if response["results"] is not None else []
    
    return response

def delete_document_chunk(chunk_id):
    if not chunk_id:
        raise HTTPException(status_code=400, detail="Chunk ID is required")
        
    success = documents_data.delete_document_chunk(chunk_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Document chunk with ID {chunk_id} not found")
    
    return {"results": [{"message": "Document chunk deleted successfully"}]}

def search_document_chunk(question, top_k, model, corpus_key, threshold):
    """
    Search for document chunks relevant to a question and generate a response.
    
    Args:
        question: The search question
        top_k: Maximum number of results to return
        model: Embedding model to use as fallback
        corpus_key: The key of the corpus to search in
        threshold: Similarity threshold for filtering results
        
    Returns:
        Search results and generated response
    """
    if not question:
        raise HTTPException(status_code=400, detail="Search question is required")
        
    if not model:
        raise HTTPException(status_code=400, detail="Embedding model is required")
    
    try:
        
        embedding_source = None
        question_embedding = None
        
        # try pgRAG first for embedding
        try:
            question_embedding = get_pgrag_embedding_for_query(question)
            embedding_source = "pgRAG"
            logger.info("Generated query embedding using pgRAG")
        except Exception as e:
            logger.warning(f"pgRAG query embedding failed, falling back to Voyage: {e}")
            
            # fallback to Voyage
            try:
                question_embedding = get_embedding(model, [question])[0]
                embedding_source = "Voyage"
                logger.info("Generated query embedding using Voyage fallback")
            except Exception as voyage_error:
                logger.error(f"Voyage embedding also failed: {voyage_error}")
                raise HTTPException(status_code=500, detail="All embedding methods failed")
            
        if not question_embedding:
            raise HTTPException(status_code=500, detail="Failed to generate embedding for the question")
        
        # Search for relevant chunks
        chunks = documents_data.search_document_chunk(question_embedding, top_k, corpus_key, threshold)
        
        if not chunks or len(chunks) == 0 or (isinstance(chunks, dict) and "results" in chunks):
            logger.warning(f"No relevant chunks found: {chunks if isinstance(chunks, dict) else 'empty list'}")
            return {"results": ["No relevant information found for your question."]}
    
        chunk_data = []
        
        rerank_scores = []
        for chunk in chunks:
            if hasattr(chunk, "chunkText") and hasattr(chunk, "rerankScore"):
                rerank_scores.append(getattr(chunk, "rerankScore"))
        
        # calculate min and max scores if we have any scores
        min_score = min(rerank_scores) if rerank_scores else 0
        max_score = max(rerank_scores) if rerank_scores else 1
        score_range = max_score - min_score if max_score > min_score else 1
        
        for chunk in chunks:
            if hasattr(chunk, "chunkText"):
                # Extract similarity score from rerankScore if available, default to 0.5 if not
                rerank_score = getattr(chunk, "rerankScore", 0.5)
                
                if score_range < 0.001:
                    position_index = len(chunk_data)
                    normalized_score = max(0.1, 1.0 - (position_index * 0.1))
                    logger.info(f"Using position-based score: {normalized_score} for position {position_index}")
                else:
                    normalized_score = max(0.1, min(0.95, 1 - ((rerank_score - min_score) / score_range)))
                    logger.info(f"Normalized score: {normalized_score} from rerank_score: {rerank_score} (min: {min_score}, max: {max_score})")
                
                chunk_data.append((chunk.chunkText, normalized_score))
        
        if not chunk_data:
            logger.warning("No chunk text found in search results")
            return {"results": ["No relevant information found for your question."]}
        
        formatted_chunks = []
        
        sorted_chunk_data = sorted(chunk_data, key=lambda x: x[1], reverse=True)
        
    
        filtered_chunk_data = [
            chunk for chunk in sorted_chunk_data 
            if chunk[1] >= 0.5  # At least 50% similarity
        ]
        
        # to include at least the top 3 chunks if available
        if len(filtered_chunk_data) < 3 and len(sorted_chunk_data) > 0:
            filtered_chunk_data = sorted_chunk_data[:min(3, len(sorted_chunk_data))]
        
        logger.info(f"Filtered from {len(sorted_chunk_data)} to {len(filtered_chunk_data)} chunks based on relevance")
        
        for i, (chunk_text, similarity) in enumerate(filtered_chunk_data):
            formatted_chunks.append((i+1, chunk_text, similarity))
        
        # build context from chunks
        context = "\n\n\n".join([chunk[1] for chunk in formatted_chunks])
        
        prompt = f"""
        question: {question}
        You are a helpful assistant, your task is to summarize the given context of information.

        data: {context}

        If the data is not sufficient to provide an answer, just strictly reply with "Not enough context to provide information."
        """
        
        try:
            result = llm_service(prompt, "", "this is a data about some information")
            logger.info("Successfully generated LLM response")
            
            return {
                "results": [result], 
                "chunks": formatted_chunks,
                "embedding_source": embedding_source
            }
        except Exception as e:
            logger.error(f"LLM service failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search_document_chunk: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
    