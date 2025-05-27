import voyageai
from typing import List
from core.db import settings as db_settings
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
api_key = os.getenv("VOYAGE_API_KEY")

# Initialize Voyage client for external embedding (as specified in requirements)
voyage = voyageai.Client(api_key=api_key)

def get_embedding(model: str, texts: List[str], input_type: str = "query"):
    """
    Embeds a list of texts using Voyage AI.
    
    Parameters:
    - model: The embedding model (default is "voyage-3-large").
    - texts: A list of strings to be embedded.
    - input_type: The type of input ("query" or "passage").

    Returns:
    - List of embeddings.
    """
    # As per requirements, we'll continue using Voyage for embeddings
    result = voyage.embed(texts, model=model, input_type=input_type)
    return result.embeddings

def get_pgrag_embedding_for_passage(text: str):
    """
    Gets an embedding for a passage using pgRAG's local embedding model.
    
    Parameters:
    - text: The text to embed.
    
    Returns:
    - The embedding vector.
    
    Raises:
    - ValueError: If the embedding generation fails.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    conn = db_settings.get_db_connection()
    try:
        cur = conn.cursor()
        
        # First check if the pgRAG extension is available
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag_bge_small_en_v15';")
        extension_exists = cur.fetchone() is not None
        
        if not extension_exists:
            logger.warning("rag_bge_small_en_v15 extension is not installed")
            raise ValueError("pgRAG embedding extension is not installed")
        
        # Try to generate the embedding
        query = "SELECT rag_bge_small_en_v15.embedding_for_passage(%s);"
        cur.execute(query, (text,))
        result = cur.fetchone()
        
        if result and result[0]:
            return result[0]
        else:
            logger.warning("pgRAG returned empty embedding result")
            raise ValueError("Failed to get embedding from pgRAG")
    except Exception as e:
        logger.error(f"Error using pgRAG embedding: {str(e)}")
        raise ValueError(f"pgRAG embedding failed: {str(e)}")
    finally:
        if conn:
            conn.close()

def get_pgrag_embedding_for_query(text: str):
    """
    Gets an embedding for a query using pgRAG's local embedding model.
    
    Parameters:
    - text: The query text to embed.
    
    Returns:
    - The embedding vector.
    
    Raises:
    - ValueError: If the embedding generation fails.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    conn = db_settings.get_db_connection()
    try:
        cur = conn.cursor()
        
        # First check if the pgRAG extension is available
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag_bge_small_en_v15';")
        extension_exists = cur.fetchone() is not None
        
        if not extension_exists:
            logger.warning("rag_bge_small_en_v15 extension is not installed")
            raise ValueError("pgRAG embedding extension is not installed")
        
        # Try to generate the embedding
        query = "SELECT rag_bge_small_en_v15.embedding_for_query(%s);"
        cur.execute(query, (text,))
        result = cur.fetchone()
        
        if result and result[0]:
            return result[0]
        else:
            logger.warning("pgRAG returned empty embedding result")
            raise ValueError("Failed to get query embedding from pgRAG")
    except Exception as e:
        logger.error(f"Error using pgRAG embedding: {str(e)}")
        raise ValueError(f"pgRAG embedding failed: {str(e)}")
    finally:
        if conn:
            conn.close()

def rerank_with_pgrag(query_text: str, passages: List[str]):
    """
    Reranks passages against a query using pgRAG's reranker.
    
    Parameters:
    - query_text: The query text.
    - passages: List of passages to rerank.
    
    Returns:
    - List of (passage, score) tuples sorted by score (best match first).
    """
    conn = db_settings.get_db_connection()
    try:
        cur = conn.cursor()
        results = []
        
        for passage in passages:
            sql_query = "SELECT rag_jina_reranker_v1_tiny_en.rerank_distance(%s, %s);"
            cur.execute(sql_query, (query_text, passage))
            score = cur.fetchone()[0]
            results.append((passage, score))
        
        # Sort by score (lower is better)
        return sorted(results, key=lambda x: x[1])
    finally:
        if conn:
            conn.close()
