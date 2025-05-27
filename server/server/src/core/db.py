import os
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class Settings:
    # Get the Neon database URL from environment variables
    DATABASE_URL: str = os.getenv('DATABASE_URL')
    
    # Print the database URL (with password masked for security)
    def __init__(self):
        if self.DATABASE_URL:
            # Mask the password for logging
            print("Here: ", self.DATABASE_URL)
            masked_url = self.DATABASE_URL
            if ":" in masked_url and "@" in masked_url:
                start = masked_url.find("://") + 3
                end = masked_url.find("@")
                user_pass = masked_url[start:end]
                if ":" in user_pass:
                    user, _ = user_pass.split(":", 1)
                    masked_url = masked_url.replace(user_pass, f"{user}:****")
            logger.info(f"Database URL configured: {masked_url}")
        else:
            logger.error("DATABASE_URL environment variable not set")

    def get_db_connection(self):
        try:
            # Connect using the Neon database URL
            if self.DATABASE_URL:
                conn = psycopg2.connect(
                    self.DATABASE_URL,
                    cursor_factory=DictCursor
                )
                return conn
            else:
                logger.error("DATABASE_URL environment variable not set")
                raise ValueError("DATABASE_URL environment variable not set")
        except Exception as e:
            logger.error(f"Failed to connect to Neon database: {str(e)}")
            raise


settings = Settings()
