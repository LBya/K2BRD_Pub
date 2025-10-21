import requests
import json
from pathlib import Path
from typing import Dict, Any
import logging

from ..config.core import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.host = settings.LLM_HOST
        self.model = settings.LLM_MODEL
        self.prompt_config = self.load_prompt_config()

    def load_prompt_config(self):
        """Load prompt configuration from JSON file."""
        config_path = Path(__file__).parent.parent / "config" / "prompt_config.json"
        try:
            with open(config_path, "r", encoding="utf-8") as file:
                return json.load(file)
        except Exception as e:
            logger.error(f"Error loading prompt configuration: {e}", exc_info=True)
            return {}

    def generate_brd(self, task_description: str, context: Dict[str, Any] = None) -> str:
        """Generate a BRD from a task description using the local LLM."""
        try:
            # Extract prompt settings from config
            prompt_settings = self.prompt_config.get("brd", {}).get("requirements", {})
            user_prompt = prompt_settings.get("user", "You are a business analyst expert at creating detailed BRDs.")
            temperature = prompt_settings.get("temperature", 0.7)

            # Format user message with context if available
            user_message = f"{user_prompt}\n\nTask: {task_description}"
            if context:
                user_message = f"{user_prompt}\n\nContext: {json.dumps(context, indent=2)}\n\nTask: {task_description}"

            payload = {
                "model": self.model,
                "messages": [
                    {"role": "user", "content": user_message}
                ],
                "temperature": temperature,
                "max_tokens": settings.MAX_TOKENS
            }

            logger.debug("Sending payload to LLM: %s", json.dumps(payload, indent=2))

            response = requests.post(f"{self.host}/v1/chat/completions", json=payload)
            
            logger.debug("LLM API Response: %s %s", response.status_code, response.text)
            
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

        except Exception as e:
            logger.error(f"Error generating BRD: {e}", exc_info=True)
            raise Exception(f"Error generating BRD: {str(e)}")

    
    def is_available(self) -> bool:
        """Check if the LLM service is available."""
        try:
            # More reliable check for LM Studio compatibility
            response = requests.get(f"{self.host}/v1/models")
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False

def get_llm_service() -> LLMService:
    """Dependency injector for LLMService."""
    return LLMService() 