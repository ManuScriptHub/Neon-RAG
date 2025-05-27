import os
import sys
import logging
from dotenv import load_dotenv
import psycopg2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def init_neon_database():
    # Get database URL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL not found in environment variables")
        return
    
    try:
        # Connect to the database
        logger.info("Connecting to Neon database...")
        conn = psycopg2.connect(db_url)
        conn.autocommit = True  # Set autocommit mode for DDL statements
        
        # Create a cursor
        cur = conn.cursor()
        
        # Enable unstable extensions
        logger.info("Enabling unstable extensions...")
        cur.execute("SET neon.allow_unstable_extensions='true';")
        
        # Install pgRAG extensions
        logger.info("Installing pgRAG extensions...")
        cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
        cur.execute("CREATE EXTENSION IF NOT EXISTS rag CASCADE;")
        cur.execute("CREATE EXTENSION IF NOT EXISTS rag_bge_small_en_v15 CASCADE;")
        cur.execute("CREATE EXTENSION IF NOT EXISTS rag_jina_reranker_v1_tiny_en CASCADE;")
        
        # Create tables
        logger.info("Creating database schema...")
        
        # Users table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS "Users" (
            "userId"       CHAR(32) PRIMARY KEY
                        DEFAULT (REPLACE(gen_random_uuid()::text, '-', '')),
            "username"     VARCHAR(50) NOT NULL,
            "email"        VARCHAR(255) UNIQUE NOT NULL,
            "passwordHash" VARCHAR(255) NOT NULL,
            "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Corpora table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS "Corpora" (
            "corpusId"  CHAR(32) PRIMARY KEY
                        DEFAULT (REPLACE(gen_random_uuid()::text, '-', '')),
            "userId"    CHAR(32) NOT NULL,
            "corpusKey" VARCHAR(100) NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Documents table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS "Documents" (
            "documentId"  CHAR(32) PRIMARY KEY
                        DEFAULT (REPLACE(gen_random_uuid()::text, '-', '')),
            "userId"      CHAR(32) NOT NULL,
            "corpusId"    CHAR(32) NOT NULL,
            "docType"     VARCHAR(50) NOT NULL,
            "docName"     VARCHAR(255),
            "sourceUrl"   TEXT,
            "fulltext"    TEXT,
            "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # DocumentChunks table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS "DocumentChunks" (
            "chunkId"       CHAR(32) PRIMARY KEY
                            DEFAULT (REPLACE(gen_random_uuid()::text, '-', '')),
            "documentId"    CHAR(32) NOT NULL,
            "chunkIndex"    INT NOT NULL,
            "chunkText"     TEXT NOT NULL,
            "embeddingData" vector(1024),
            "metaData"      JSONB,
            "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Create indexes
        logger.info("Creating indexes...")
        cur.execute("""
        CREATE INDEX IF NOT EXISTS "DocumentChunks_embedding_hnsw_idx"
        ON "DocumentChunks"
        USING hnsw ("embeddingData" vector_cosine_ops);
        """)
        
        cur.execute("""
        CREATE INDEX IF NOT EXISTS "DocumentChunks_metaData_gin_idx"
        ON "DocumentChunks"
        USING GIN("metaData");
        """)
        
        # Verify the setup
        logger.info("Verifying setup...")
        
        # Check if pgRAG extensions are installed
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag';")
        rag_installed = cur.fetchone() is not None
        logger.info(f"pgRAG extension installed: {rag_installed}")
        
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag_bge_small_en_v15';")
        bge_installed = cur.fetchone() is not None
        logger.info(f"pgRAG BGE model installed: {bge_installed}")
        
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag_jina_reranker_v1_tiny_en';")
        jina_installed = cur.fetchone() is not None
        logger.info(f"pgRAG Jina reranker installed: {jina_installed}")
        
        # Check if the tables exist
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Users');")
        users_exists = cur.fetchone()[0]
        logger.info(f"Users table exists: {users_exists}")
        
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Corpora');")
        corpora_exists = cur.fetchone()[0]
        logger.info(f"Corpora table exists: {corpora_exists}")
        
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Documents');")
        documents_exists = cur.fetchone()[0]
        logger.info(f"Documents table exists: {documents_exists}")
        
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'DocumentChunks');")
        chunks_exists = cur.fetchone()[0]
        logger.info(f"DocumentChunks table exists: {chunks_exists}")
        
        # Close the connection
        cur.close()
        conn.close()
        logger.info("Database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")

if __name__ == "__main__":
    init_neon_database()