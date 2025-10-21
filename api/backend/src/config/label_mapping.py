import json
from pathlib import Path
import logging

from .label_config import LabelConfig, LabelCategory

logger = logging.getLogger(__name__)
logger.debug("Initializing label_mapping module")


def load_config() -> LabelConfig:
    """Loads label configuration from JSON, falling back to default."""
    config_path = Path(__file__).parent / "label_config.json"
    if not config_path.exists():
        logger.warning("label_config.json not found, using default config.")
        return LabelConfig.default_config()
    
    logger.info(f"Loading label configuration from {config_path}")
    with open(config_path) as f:
        data = json.load(f)
        return LabelConfig.model_validate(data)

def save_config(config: LabelConfig):
    """Saves label configuration to JSON."""
    config_path = Path(__file__).parent / "label_config.json"
    logger.info(f"Saving label configuration to {config_path}")
    with open(config_path, 'w') as f:
        json.dump(config.model_dump(), f, indent=2) 