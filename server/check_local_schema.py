import psycopg2
from psycopg2.extras import DictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_local_schema():
    try:
        # Connect to local database
        logger.info("Connecting to local database...")
        conn = psycopg2.connect(
            host="localhost",
            database="RAG-ify",
            user="postgres",
            password="radhe",
            port=5432,
            cursor_factory=DictCursor
        )
        
        # Create cursor
        cur = conn.cursor()
        
        # Check Users table schema
        logger.info("Checking Users table schema...")
        cur.execute("""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'Users'
        ORDER BY ordinal_position;
        """)
        users_schema = cur.fetchall()
        for col in users_schema:
            logger.info(f"Column: {col['column_name']}, Type: {col['data_type']}, Length: {col['character_maximum_length']}")
        
        # Check Corpora table schema
        logger.info("\nChecking Corpora table schema...")
        cur.execute("""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'Corpora'
        ORDER BY ordinal_position;
        """)
        corpora_schema = cur.fetchall()
        for col in corpora_schema:
            logger.info(f"Column: {col['column_name']}, Type: {col['data_type']}, Length: {col['character_maximum_length']}")
        
        # Check Documents table schema
        logger.info("\nChecking Documents table schema...")
        cur.execute("""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'Documents'
        ORDER BY ordinal_position;
        """)
        documents_schema = cur.fetchall()
        for col in documents_schema:
            logger.info(f"Column: {col['column_name']}, Type: {col['data_type']}, Length: {col['character_maximum_length']}")
        
        # Check DocumentChunks table schema
        logger.info("\nChecking DocumentChunks table schema...")
        cur.execute("""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'DocumentChunks'
        ORDER BY ordinal_position;
        """)
        chunks_schema = cur.fetchall()
        for col in chunks_schema:
            logger.info(f"Column: {col['column_name']}, Type: {col['data_type']}, Length: {col['character_maximum_length']}")
        
        # Close connection
        cur.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"Failed to check schema: {str(e)}")

if __name__ == "__main__":
    check_local_schema()