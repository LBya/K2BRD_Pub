import pytest
from fastapi.testclient import TestClient
import os

@pytest.fixture(scope='session')
def set_test_environment(monkeypatch):
    """Set mock environment variables for the entire test session."""
    monkeypatch.setenv("TRELLO_API_KEY", "test_api_key")
    monkeypatch.setenv("TRELLO_TOKEN", "test_token")
    monkeypatch.setenv("GITHUB_TOKEN", "test_github_token")
    monkeypatch.setenv("LLM_MODEL", "test_llm_model")
    monkeypatch.setenv("LLM_API_KEY", "test_llm_api_key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test_anthropic_key")
    monkeypatch.setenv("OPENAI_API_KEY", "test_openai_key")
    monkeypatch.setenv("CLIENT_ORIGIN", "http://test.com")
    monkeypatch.setenv("PROJECT_NAME", "Test Project")

# This import must come AFTER the environment is patched
from src.main import app

@pytest.fixture(scope="module")
def client():
    """
    Yield a TestClient instance that can be used in tests.
    """
    with TestClient(app) as c:
        yield c 