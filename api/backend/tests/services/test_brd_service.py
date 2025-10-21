import pytest
from unittest.mock import MagicMock
from src.services.brd_service import BRDService
from src.services.trello_service import TrelloService
from src.services.llm_service import LLMService
from src.models.card import TrelloCard

@pytest.fixture
def mock_trello_service():
    """Fixture to create mock trello service."""
    return MagicMock(spec=TrelloService)

@pytest.fixture
def mock_llm_service():
    """Fixture to create mock LLM service."""
    return MagicMock(spec=LLMService)

@pytest.fixture
def brd_service(mock_trello_service, mock_llm_service):
    """Fixture to create a BRDService with mocked dependencies."""
    return BRDService(
        trello_service=mock_trello_service,
        llm_service=mock_llm_service
    )

def test_generate_brd_for_cards(brd_service: BRDService, mock_llm_service):
    """Test the generation of a BRD for a list of Trello cards."""
    # Create a mock TrelloCard
    mock_card = TrelloCard(
        id="1",
        name="Test Card",
        description="A task",
        github_repo="user/repo",
        impacted_assets=["a.txt"]
    )
    
    # Configure mock service return values
    mock_llm_service.generate_brd.return_value = "Generated BRD text."

    results = brd_service.generate_brd_for_cards([mock_card])

    # Assert that the correct service methods were called
    mock_llm_service.generate_brd.assert_called_once()
    
    # Assert the structure and content of the result
    assert len(results) == 1
    result = results[0]
    assert result["card"] == mock_card.model_dump()
    assert result["brd"] == "Generated BRD text."

def test_generate_brd_for_cards_with_empty_list(brd_service: BRDService, mock_llm_service):
    """Test the generation of a BRD with an empty list of cards."""
    results = brd_service.generate_brd_for_cards([])

    # Assert that the LLM service was not called
    mock_llm_service.generate_brd.assert_not_called()
    
    # Assert that the result is an empty list
    assert len(results) == 0
    assert results == [] 