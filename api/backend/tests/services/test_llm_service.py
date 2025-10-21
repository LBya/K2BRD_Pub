import pytest
from unittest.mock import patch
from src.services.llm_service import LLMService

@pytest.fixture
def llm_service():
    """Fixture to create an LLMService instance."""
    return LLMService()

@patch('src.services.llm_service.requests')
def test_generate_brd(mock_requests, llm_service: LLMService):
    """Test the successful generation of a BRD."""
    mock_response = mock_requests.post.return_value
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "This is a generated BRD."}}]
    }
    mock_response.raise_for_status.return_value = None

    brd = llm_service.generate_brd("Test task", {})

    assert brd == "This is a generated BRD."
    mock_requests.post.assert_called_once()

@patch('src.services.llm_service.requests')
def test_is_available_success(mock_requests, llm_service: LLMService):
    """Test the is_available check when the service is up."""
    mock_response = mock_requests.get.return_value
    mock_response.status_code = 200

    assert llm_service.is_available() is True
    mock_requests.get.assert_called_once_with(f"{llm_service.host}/v1/models")

@patch('src.services.llm_service.requests')
def test_is_available_failure(mock_requests, llm_service: LLMService):
    """Test the is_available check when the service is down."""
    mock_requests.get.side_effect = Exception("Connection error")

    assert llm_service.is_available() is False 