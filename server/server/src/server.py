from fastapi import FastAPI
from api.routes import router as api_router
from scalar_fastapi import get_scalar_api_reference
from core.db import settings as db_settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="RAG-ify", openapi_url="/openapi.json", debug=False)

app.include_router(api_router, prefix="/api/v1")

router = app.router

@router.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
    )

@app.on_event("startup")
async def startup_db_client():
    """Verify database connection on startup."""
    try:
        conn = db_settings.get_db_connection()
        # Test if pgRAG extensions are available
        cur = conn.cursor()
        
        # Get database info
        cur.execute("SELECT current_database(), current_user;")
        db_info = cur.fetchone()
        logger.info(f"Connected to database: {db_info[0]} as user: {db_info[1]}")
        
        # Check pgRAG extensions
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag';")
        rag_installed = cur.fetchone() is not None
        
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag_bge_small_en_v15';")
        bge_installed = cur.fetchone() is not None
        
        cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'rag_jina_reranker_v1_tiny_en';")
        jina_installed = cur.fetchone() is not None
        
        if not (rag_installed and bge_installed and jina_installed):
            logger.error("Required pgRAG extensions are not installed!")
            logger.error(f"pgRAG extension installed: {rag_installed}")
            logger.error(f"pgRAG BGE model installed: {bge_installed}")
            logger.error(f"pgRAG Jina reranker installed: {jina_installed}")
            logger.error("Please run the init_neon_db.py script to set up the database")
        else:
            logger.info("Database connection successful with all required extensions")
        
        # Check if tables exist
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Users');")
        users_exists = cur.fetchone()[0]
        
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'DocumentChunks');")
        chunks_exists = cur.fetchone()[0]
        
        if not (users_exists and chunks_exists):
            logger.error("Required database tables are not created!")
            logger.error(f"Users table exists: {users_exists}")
            logger.error(f"DocumentChunks table exists: {chunks_exists}")
            logger.error("Please run the init_neon_db.py script to set up the database")
        else:
            logger.info("All required database tables are present")
        
        # Close the connection
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        logger.error("Application may not function correctly without database connection")
        logger.error("Please check your DATABASE_URL environment variable and run init_neon_db.py")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
