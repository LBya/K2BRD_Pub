from fastapi.testclient import TestClient
from unittest.mock import MagicMock
import pytest

from src.main import app
from src.services.trello_service import get_trello_service
from src.services.llm_service import get_llm_service
from src.services.brd_service import get_brd_service


def test_health_check(client: TestClient):
    """
    Test the health check endpoint.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_get_boards(client: TestClient):
    """Test the endpoint for getting Trello boards."""
    # Arrange: Create a mock service and override the dependency
    mock_trello = MagicMock()
    mock_trello.get_boards.return_value = [{"id": "board1", "name": "Test Board"}]
    app.dependency_overrides[get_trello_service] = lambda: mock_trello

    # Act
    response = client.get("/api/v1/trello/boards")
    
    # Assert
    assert response.status_code == 200
    assert response.json() == [{"id": "board1", "name": "Test Board"}]
    mock_trello.get_boards.assert_called_once()

    # Cleanup
    app.dependency_overrides.clear()

def test_get_board_cards(client: TestClient):
    """Test the endpoint for getting cards from a board."""
    # Arrange
    board_id = "board1"
    mock_trello = MagicMock()
    mock_trello.get_board_cards.return_value = [
        {"id": "card1", "name": "Test Card", "desc": ""},
    ]
    app.dependency_overrides[get_trello_service] = lambda: mock_trello

    # Act
    response = client.get(f"/api/v1/trello/boards/{board_id}/cards")
    
    # Assert
    assert response.status_code == 200
    assert len(response.json()) == 1
    mock_trello.get_board_cards.assert_called_once_with(board_id)

    # Cleanup
    app.dependency_overrides.clear()

def test_generate_brd_endpoint(client: TestClient):
    """Test the BRD generation endpoint."""
    # Arrange
    mock_llm = MagicMock()
    mock_llm.is_available.return_value = True
    mock_brd = MagicMock()
    mock_brd.generate_brd_for_cards.return_value = {"status": "done"}

    app.dependency_overrides[get_llm_service] = lambda: mock_llm
    app.dependency_overrides[get_brd_service] = lambda: mock_brd

    request_payload = {
        "cards": [{
            "id": "1", 
            "name": "Test", 
            "description": "desc", 
            "list_name": "list"
        }]
    }
    # Act
    response = client.post("/api/v1/brd/generate", json=request_payload)

    # Assert
    assert response.status_code == 200
    assert response.json() == {"status": "done"}
    mock_llm.is_available.assert_called_once()
    mock_brd.generate_brd_for_cards.assert_called_once()
    
    # Cleanup
    app.dependency_overrides.clear() 