import pytest
from unittest.mock import MagicMock
from src.services.trello_service import TrelloService
from src.models.card import TrelloCard

@pytest.fixture
def trello_service(mocker):
    """Fixture to create a TrelloService with a mocked _make_request method."""
    service = TrelloService()
    mocker.patch.object(service, '_make_request')
    return service

def test_get_boards(trello_service: TrelloService):
    """Test fetching Trello boards."""
    mock_boards = [{"id": "board1", "name": "Board 1"}]
    trello_service._make_request.return_value = mock_boards

    boards = trello_service.get_boards()

    trello_service._make_request.assert_called_once_with("GET", "members/me/boards")
    assert boards == mock_boards

def test_get_board_cards_n_plus_1_fix(trello_service: TrelloService):
    """Test that get_board_cards makes one call for lists and one for cards."""
    board_id = "board1"
    
    mock_lists = [{"id": "list1", "name": "To Do"}]
    mock_cards_data = [{"id": "card1", "name": "Card 1", "idList": "list1", "desc": ""}]
    
    # Set up the mock to return different values for different calls
    trello_service._make_request.side_effect = [mock_lists, mock_cards_data]

    cards = trello_service.get_board_cards(board_id)

    assert trello_service._make_request.call_count == 2
    trello_service._make_request.assert_any_call("GET", f"boards/{board_id}/lists", params={"fields": "id,name"})
    trello_service._make_request.assert_any_call("GET", f"boards/{board_id}/cards", params={"fields": "all"})
    
    assert len(cards) == 1
    assert isinstance(cards[0], TrelloCard)
    assert cards[0].name == "Card 1"
    assert cards[0].list_name == "To Do" 