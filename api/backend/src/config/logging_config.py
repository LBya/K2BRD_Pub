import logging
import logging.config
from ..config.core import settings

def setup_logging():
    log_level = "DEBUG" if settings.DEV_MODE else "INFO"
    
    # Base configuration
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "[%(levelname)s] [%(asctime)s] [%(name)s]: %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "stream": "ext://sys.stdout"
            }
        },
        "root": {
            "level": log_level,
            "handlers": ["console"]
        }
    }
    
    # Add JSON formatter for non-dev environments
    if not settings.DEV_MODE:
        config["formatters"]["json"] = {
            "class": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s %(filename)s %(lineno)d"
        }
        config["handlers"]["console"]["formatter"] = "json"

    logging.config.dictConfig(config) 