from core.db import settings as db_settings
import logging
from dataclasses import dataclass
from typing import List, Optional, Union
from psycopg2.extras import RealDictCursor

@dataclass
class DocumentChunk:
    chunkId: str
    documentId: str
    chunkText: str
    embeddingData: List[float]
    rerankScore: Optional[float] = None

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class DocumentChunkModel:
    def get_document_chunks(self, where_conditions=None):
        conn = db_settings.get_db_connection()  
        try:
            cur = conn.cursor()
            
            query = 'SELECT * FROM "DocumentChunks"'
            params = []
            
            if where_conditions and isinstance(where_conditions, dict) and where_conditions:
                where_clauses = []
                for key, value in where_conditions.items():
                    if key in ["chunkId", "documentId", "chunkIndex", "chunkText", "metaData"]:
                        where_clauses.append(f'"{key}" = %s')
                        params.append(value)
                
                if where_clauses:
                    query += " WHERE " + " AND ".join(where_clauses)
            
            query += ";"
            logger.info(f"Executing query: {query} with params: {params}")
            
            cur.execute(query, params)
            rows = cur.fetchall()
            logger.info(f"get_document_chunks result: {len(rows)} records")
            
            
            formatted_results = []
            if rows:
                columns = [desc[0] for desc in cur.description]  
                for row in rows:
                    formatted_results.append(dict(zip(columns, row)))  
            
            return {"results": formatted_results}
        except Exception as e:
            logger.error(f"An error occurred in get_document_chunks: {e}")
            return {"results": [], "error": str(e)}
        finally:
            if conn:
                conn.close()

    def get_document_chunk(self, chunk_id):
        conn = db_settings.get_db_connection()  
        try:
            cur = conn.cursor()
            query = 'SELECT * FROM "DocumentChunks" WHERE "chunkId" = %s;'
            cur.execute(query, (chunk_id,))
            row = cur.fetchone()
            if row:
                columns = [desc[0] for desc in cur.description]  
                result = dict(zip(columns, row))  
                return {"results": result}  
            return {"results": None} 
        except Exception as e:
            logger.error(f"An error occurred in get_document_chunk: {e}")
            return {"results": {"error": str(e)}} 
        finally:
            if conn:
                conn.close()

    def create_document_chunk(self, chunk_input_data):
        """
        Creates a new document chunk and returns the created chunk.
        """
        conn = db_settings.get_db_connection()
        try:
            cur = conn.cursor()
            columns = ', '.join([f'"{key}"' for key in chunk_input_data.keys()])
            placeholders = ', '.join(['%s'] * len(chunk_input_data))
            query = f'INSERT INTO "DocumentChunks" ({columns}) VALUES ({placeholders}) RETURNING *;'
            cur.execute(query, tuple(chunk_input_data.values()))
            row = cur.fetchone()
            conn.commit()
            if row:
                columns = [desc[0] for desc in cur.description]  
                result = dict(zip(columns, row))  
                logger.info(f"create_document_chunk result: {result}")
                return {"results": result}  
            return {"results": None}  
        except Exception as e:
            logger.error(f"An error occurred in create_document_chunk: {e}")
            conn.rollback()
            return {"results": {"error": str(e)}}  
        finally:
            if conn:
                conn.close()

    

    def update_document_chunk(self, chunk_id, chunk_input_data):
        """
        Updates a document chunk with the given updates dictionary.
        """
        conn = db_settings.get_db_connection()
        try:
            cur = conn.cursor()

            if not chunk_id:
                return {"error": "Missing chunk_id for update."}

            set_clause = ', '.join([f'"{key}" = %s' for key in chunk_input_data.keys()])
            query = f'UPDATE "DocumentChunks" SET {set_clause} WHERE "chunkId" = %s RETURNING *;'
            params = tuple(chunk_input_data.values()) + (chunk_id,)  
            cur.execute(query, params)
            conn.commit()  
            row = cur.fetchone()

            if row:
                result_columns = [desc[0] for desc in cur.description]
                result = dict(zip(result_columns, row))
                logger.info(f"update_document_chunk result: {result}")
                return {"results": result} 

            return {"results": None} 

        except Exception as e:
            logger.error(f"An error occurred in update_document_chunk: {e}")
            conn.rollback() 
            return {"results": {"error": str(e)}} 

        finally:
            if conn:
                conn.close()


    def delete_document_chunk(self, chunk_id):
        """
        Deletes a document chunk by its ID.
        """
        conn = db_settings.get_db_connection()
        try:
            cur = conn.cursor()
            query = 'DELETE FROM "DocumentChunks" WHERE "chunkId" = %s;'
            cur.execute(query, (chunk_id,))
            conn.commit()
            return cur.rowcount > 0  # returns True if a row was deleted
        except Exception as e:
            print(f"An error occurred in delete_document: {e}")
            return False
        finally:
            if conn:
                conn.close()    

    def search_document_chunk(
        self,
        question_embedding: List[float],
        top_k: int,
        corpus_key: str,
        threshold: float
    ) -> Union[List[DocumentChunk], dict]:
        """
        Finds the top_k most similar chunks in a corpus to the question_embedding,
        then optionally reranks them by a semantic reranker if question_text exists.
        """
        logger.info(f"Searching document chunks in corpus '{corpus_key}' with threshold {threshold}")
        conn = db_settings.get_db_connection()
        try:
            try:
                with conn.cursor() as cur:
                    cur.execute('SELECT "corpusId" FROM "Corpora" WHERE "corpusKey" = %s;', (corpus_key,))
                    corpus_row = cur.fetchone()
                    if not corpus_row:
                        logger.warning(f"No corpus found for key: {corpus_key}")
                        return {"results": "no corpus found"}
                    
                    corpus_id = corpus_row[0]
                    
                    cur.execute('SELECT "documentId" FROM "Documents" WHERE "corpusId" = %s;', (corpus_id,))
                    document_ids = [row[0] for row in cur.fetchall()]
                    if not document_ids:
                        logger.warning(f"No documents found for corpus: {corpus_key}")
                        return {"results": "no documents found"}
            except Exception as e:
                logger.error(f"Error getting corpus or documents: {e}")
                return {"results": "error getting corpus data"}
            
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    try:
                        sql = """
                        WITH corpus_docs AS (
                          SELECT d."documentId"
                          FROM "Documents" d
                          WHERE d."corpusId" = %s
                        )
                        SELECT
                          dc."chunkId",
                          dc."documentId",
                          dc."chunkText",
                          dc."embeddingData",
                          dc."embeddingData" <=> %s::vector AS "rerankScore"
                        FROM "DocumentChunks" dc
                        JOIN corpus_docs cd ON dc."documentId" = cd."documentId"
                        WHERE
                          dc."embeddingData" <=> %s::vector < %s
                        ORDER BY "rerankScore"
                        LIMIT %s;
                        """
                        
                        cur.execute(sql, (corpus_id, question_embedding, question_embedding, threshold, top_k))
                        rows = cur.fetchall()
                        logger.info(f"Vector search found {len(rows) if rows else 0} results")
                        
                    except Exception as vector_error:
                        logger.warning(f"Vector search failed: {vector_error}, trying fallback search")
                        
                        fallback_sql = """
                        SELECT
                          dc."chunkId",
                          dc."documentId",
                          dc."chunkText",
                          dc."embeddingData",
                          0.5 AS "rerankScore"  -- Default score for fallback results
                        FROM "DocumentChunks" dc
                        WHERE dc."documentId" = ANY(%s)
                        ORDER BY dc."createdAt" DESC
                        LIMIT %s;
                        """
                        
                        cur.execute(fallback_sql, (document_ids, top_k))
                        rows = cur.fetchall()
                        logger.info(f"Fallback search found {len(rows) if rows else 0} results")
                    
                    if not rows:
                        logger.warning("No matching chunks found")
                        return {"results": "no matching chunks"}
                    
                    try:
                        # only attempt reranking if we have the question text
                        with conn.cursor() as rerank_cur:
                            rerank_cur.execute('SELECT "questionText" FROM "Questions" WHERE "questionEmbedding" = %s::vector LIMIT 1;', 
                                              (question_embedding,))
                            question_row = rerank_cur.fetchone()
                            
                            if question_row and question_row[0]:
                                question_text = question_row[0]
                                logger.info("Found question text, attempting reranking")
                                
                                for row in rows:
                                    try:
                                        rerank_cur.execute('SELECT rag_jina_reranker_v1_tiny_en.rerank_distance(%s, %s);', 
                                                         (question_text, row["chunkText"]))
                                        rerank_score = rerank_cur.fetchone()[0]
                                        row["rerankScore"] = rerank_score
                                    except Exception as rerank_error:
                                        logger.warning(f"Individual reranking failed: {rerank_error}")
                                
                                rows = sorted(rows, key=lambda x: x["rerankScore"])
                                logger.info("Successfully reranked results")
                    except Exception as rerank_error:
                        logger.warning(f"Reranking process failed: {rerank_error}")
                    
                    return [DocumentChunk(**row) for row in rows]
                    
            except Exception as search_error:
                logger.error(f"Search process failed: {search_error}")
                return {"results": "search error"}
                
        except Exception as e:
            logger.error(f"search_document_chunks error: {e}")
            return {"results": "error"}
        finally:
            if conn:
                conn.close()
