import os
import sys
import logging
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import DictCursor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the server directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

def test_env_loading():
    # Load environment variables
    load_dotenv()
    
    # Check if DATABASE_URL is set
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        # Mask the password for logging
        masked_url = db_url
        if ":" in masked_url and "@" in masked_url:
            start = masked_url.find("://") + 3
            end = masked_url.find("@")
            user_pass = masked_url[start:end]
            if ":" in user_pass:
                user, _ = user_pass.split(":", 1)
                masked_url = masked_url.replace(user_pass, f"{user}:****")
        logger.info(f"DATABASE_URL found: {masked_url}")
    else:
        logger.error("DATABASE_URL not found in environment variables")
    
    # Print all environment variables for debugging
    logger.info("All environment variables:")
    for key, value in os.environ.items():
        if key.lower() in ["database_url", "db_host", "db_port", "db_name", "db_user", "db_pass"]:
            if "pass" in key.lower() or "database_url" in key.lower():
                logger.info(f"{key}: {'*' * len(value)}")
            else:
                logger.info(f"{key}: {value}")

def test_db_connection():
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL not found in environment variables")
        return
    
    try:
        # Connect to the database
        logger.info("Attempting to connect to Neon database...")
        conn = psycopg2.connect(db_url, cursor_factory=DictCursor)
        
        # Verify connection
        cur = conn.cursor()
        cur.execute("SELECT current_database(), current_user, version();")
        db_info = cur.fetchone()
        logger.info(f"Connected to database: {db_info[0]} as user: {db_info[1]}")
        logger.info(f"PostgreSQL version: {db_info[2]}")
        
        # Check if this is a Neon database
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'pg_neon' LIMIT 1;")
        is_neon = cur.fetchone() is not None
        logger.info(f"Is Neon database: {is_neon}")
        
        # Check if pgRAG extensions are installed
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag' LIMIT 1;")
        rag_installed = cur.fetchone() is not None
        logger.info(f"pgRAG extension installed: {rag_installed}")
        
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag_bge_small_en_v15' LIMIT 1;")
        bge_installed = cur.fetchone() is not None
        logger.info(f"pgRAG BGE model installed: {bge_installed}")
        
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag_jina_reranker_v1_tiny_en' LIMIT 1;")
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
        logger.info("Database connection test completed successfully")
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")

if __name__ == "__main__":
    logger.info("Testing environment variable loading...")
    test_env_loading()
    
    logger.info("\nTesting database connection...")
    test_db_connection()