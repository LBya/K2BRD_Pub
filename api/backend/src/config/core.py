from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
import os

# Construct the path to the .env file
# This assumes the script is run from the 'api/backend' directory.
# The path will be 'D:/Portfolio/autoPM/api/backend/.env'
env_path = Path(__file__).resolve().parent.parent.parent / '.env'

class Settings(BaseSettings):
    # Load .env file from the backend/ directory
    model_config = SettingsConfigDict(env_file=env_path, extra='ignore')

    # Application
    PROJECT_NAME: str = "K2BRD"
    DEV_MODE: bool = False

    # Trello Config
    TRELLO_API_KEY: str
    TRELLO_TOKEN: str
    TRELLO_BASE_URL: str = "https://api.trello.com/1"

    # GitHub Config
    GITHUB_TOKEN: str

    # LLM Config
    LLM_HOST: str = "http://localhost:1234" # Or the Docker service name, e.g., http://lm_studio:1234
    LLM_MODEL: str
    MAX_TOKENS: int = 2500

    # CORS
    CLIENT_ORIGIN: str = "http://localhost:5173"


# Create a single, importable instance
settings = Settings() 