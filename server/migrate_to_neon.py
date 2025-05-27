import os
import sys
import logging
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import DictCursor
import json
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def generate_uuid_string():
    """Generate a UUID string without hyphens."""
    return uuid.uuid4().hex

def migrate_data_to_neon():
    # Get Neon database URL
    neon_db_url = os.getenv("DATABASE_URL")
    if not neon_db_url:
        logger.error("DATABASE_URL not found in environment variables")
        return
    
    try:
        # Connect to local database
        logger.info("Connecting to local database...")
        local_conn = psycopg2.connect(
            host="localhost",
            database="RAG-ify",
            user="postgres",
            password="radhe",
            port=5432,
            cursor_factory=DictCursor
        )
        
        # Connect to Neon database
        logger.info("Connecting to Neon database...")
        neon_conn = psycopg2.connect(neon_db_url, cursor_factory=DictCursor)
        
        # Create cursors
        local_cur = local_conn.cursor()
        neon_cur = neon_conn.cursor()
        
        # Create mapping dictionaries to track ID conversions
        corpus_id_map = {}  # Maps local corpus IDs to Neon corpus IDs
        document_id_map = {}  # Maps local document IDs to Neon document IDs
        
        # Migrate Users
        logger.info("Migrating Users...")
        local_cur.execute('SELECT * FROM "Users";')
        users = local_cur.fetchall()
        logger.info(f"Found {len(users)} users to migrate")
        
        for user in users:
            # Check if user already exists in Neon
            neon_cur.execute('SELECT 1 FROM "Users" WHERE "userId" = %s;', (user["userId"],))
            if neon_cur.fetchone() is None:
                # Insert user into Neon
                neon_cur.execute(
                    'INSERT INTO "Users" ("userId", "username", "email", "passwordHash", "createdAt", "updatedAt") VALUES (%s, %s, %s, %s, %s, %s);',
                    (user["userId"], user["username"], user["email"], user["passwordHash"], user["createdAt"], user["updatedAt"])
                )
        
        # Migrate Corpora
        logger.info("Migrating Corpora...")
        local_cur.execute('SELECT * FROM "Corpora";')
        corpora = local_cur.fetchall()
        logger.info(f"Found {len(corpora)} corpora to migrate")
        
        for corpus in corpora:
            # Generate a new UUID for the corpus
            new_corpus_id = generate_uuid_string()
            
            # Store the mapping from local ID to new UUID
            corpus_id_map[str(corpus["corpusId"])] = new_corpus_id
            
            # Insert corpus into Neon with the new UUID
            neon_cur.execute(
                'INSERT INTO "Corpora" ("corpusId", "userId", "corpusKey", "createdAt", "updatedAt") VALUES (%s, %s, %s, %s, %s);',
                (new_corpus_id, corpus["userId"], corpus["corpusKey"], corpus["createdAt"], corpus["updatedAt"])
            )
            logger.info(f"Migrated corpus {corpus['corpusId']} to {new_corpus_id}")
        
        # Migrate Documents
        logger.info("Migrating Documents...")
        local_cur.execute('SELECT * FROM "Documents";')
        documents = local_cur.fetchall()
        logger.info(f"Found {len(documents)} documents to migrate")
        
        for document in documents:
            # Generate a new UUID for the document
            new_document_id = generate_uuid_string()
            
            # Store the mapping
            if "documentId" in document and document["documentId"]:
                document_id_map[str(document["documentId"])] = new_document_id
            elif "docId" in document and document["docId"]:
                document_id_map[str(document["docId"])] = new_document_id
            
            # Get the new corpus ID from the mapping
            new_corpus_id = corpus_id_map.get(str(document["corpusId"]))
            if not new_corpus_id:
                logger.warning(f"No mapping found for corpus ID {document['corpusId']}, skipping document")
                continue
            
            # Prepare document data
            doc_data = {
                "documentId": new_document_id,
                "userId": document["userId"],
                "corpusId": new_corpus_id,
                "docType": document["docType"],
                "docName": document["docName"],
                "sourceUrl": document["sourceUrl"] if "sourceUrl" in document else None,
                "createdAt": document["createdAt"],
                "updatedAt": document["updatedAt"]
            }
            
            # Add fulltext if it exists
            if "rawText" in document and document["rawText"]:
                doc_data["fulltext"] = document["rawText"]
            
            # Build the SQL query
            columns = list(doc_data.keys())
            values = list(doc_data.values())
            placeholders = ", ".join(["%s"] * len(values))
            columns_str = ", ".join([f'"{col}"' for col in columns])
            
            # Insert document into Neon
            neon_cur.execute(
                f'INSERT INTO "Documents" ({columns_str}) VALUES ({placeholders});',
                tuple(values)
            )
            logger.info(f"Migrated document to {new_document_id}")
        
        # Migrate DocumentChunks
        logger.info("Migrating DocumentChunks...")
        local_cur.execute('SELECT * FROM "DocumentChunks";')
        chunks = local_cur.fetchall()
        logger.info(f"Found {len(chunks)} document chunks to migrate")
        
        for chunk in chunks:
            # Generate a new UUID for the chunk if needed
            if "chunkId" not in chunk or not chunk["chunkId"]:
                chunk["chunkId"] = generate_uuid_string()
            
            # Get the new document ID from the mapping
            new_document_id = document_id_map.get(str(chunk["documentId"]))
            if not new_document_id:
                logger.warning(f"No mapping found for document ID {chunk['documentId']}, skipping chunk")
                continue
            
            # Prepare chunk data
            chunk_data = {
                "chunkId": chunk["chunkId"],
                "documentId": new_document_id,
                "chunkIndex": chunk["chunkIndex"],
                "chunkText": chunk["chunkText"],
                "metaData": chunk["metaData"] if "metaData" in chunk else None,
                "createdAt": chunk["createdAt"],
                "updatedAt": chunk["updatedAt"]
            }
            
            # Add embedding data if it exists
            if "embeddingData" in chunk and chunk["embeddingData"] is not None:
                chunk_data["embeddingData"] = chunk["embeddingData"]
            
            # Build the SQL query
            columns = list(chunk_data.keys())
            values = list(chunk_data.values())
            placeholders = ", ".join(["%s"] * len(values))
            columns_str = ", ".join([f'"{col}"' for col in columns])
            
            # Insert chunk into Neon
            try:
                neon_cur.execute(
                    f'INSERT INTO "DocumentChunks" ({columns_str}) VALUES ({placeholders});',
                    tuple(values)
                )
                logger.info(f"Migrated chunk {chunk['chunkId']}")
            except Exception as e:
                logger.error(f"Failed to migrate chunk {chunk['chunkId']}: {str(e)}")
                # Continue with other chunks
                continue
        
        # Commit changes
        neon_conn.commit()
        logger.info("Migration completed successfully")
        
        # Close connections
        local_cur.close()
        neon_cur.close()
        local_conn.close()
        neon_conn.close()
        
    except Exception as e:
        logger.error(f"Failed to migrate data: {str(e)}")
        if 'neon_conn' in locals():
            neon_conn.rollback()

if __name__ == "__main__":
    migrate_data_to_neon()