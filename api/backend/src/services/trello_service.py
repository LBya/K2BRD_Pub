import requests
import logging
from typing import List, Dict, Any, Optional
from ..config.core import settings
from ..models.card import TrelloCard

# Configure logging
logger = logging.getLogger(__name__)

EXCLUDED_CARD_NAMES = ["Design & Research", "Done", "[Completed Task]"]

class TrelloCardNotFoundError(Exception):
    pass

class TrelloService:
    def __init__(self):
        # Log API key and token presence (not the actual values)
        logger.debug(f"Initializing TrelloService")
        logger.debug(f"API Key present: {bool(settings.TRELLO_API_KEY)}")
        logger.debug(f"Token present: {bool(settings.TRELLO_TOKEN)}")
        
        self.auth_params = {
            "key": settings.TRELLO_API_KEY,
            "token": settings.TRELLO_TOKEN
        }
        
    def _make_request(self, method: str, endpoint: str, params: Dict = None, json: Dict = None) -> Dict:
        url = f"{settings.TRELLO_BASE_URL}/{endpoint}"
        params = {**self.auth_params, **(params or {})}
        headers = {
            "Accept": "application/json"
        }
        
        # Log request details (excluding sensitive info)
        logger.debug(f"Making request to: {url}")
        logger.debug(f"Method: {method}")
        logger.debug(f"Headers: {headers}")
        logger.debug(f"Params keys: {list(params.keys())}")
        
        try:
            response = requests.request(
                method,
                url,
                headers=headers,
                params=params,
                json=json
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None and e.response.status_code == 404:
                # Re-raise as our custom, more specific exception
                raise TrelloCardNotFoundError(f"Card not found at endpoint: {url}")
            logger.error(f"Request failed: {str(e)}")
            logger.error(f"Response status code: {e.response.status_code if hasattr(e, 'response') and e.response is not None else 'No response'}")
            logger.error(f"Response body: {e.response.text if hasattr(e, 'response') and e.response is not None else 'No response'}")
            raise
    
    def get_boards(self) -> List[Dict[str, Any]]:
        """Get all boards for the authenticated user."""
        logger.info("Fetching boards for authenticated user")
        return self._make_request("GET", "members/me/boards")
    
    def get_board_cards(self, board_id: str) -> List[TrelloCard]: # Return type is TrelloCard
        """
        Get all cards from a specific board, optimizing list lookups.
        This method resolves the N+1 query problem by fetching all lists
        on the board in a single call.
        """
        logger.info(f"Fetching cards and lists for board: {board_id}")
        
        # 1. Fetch all lists on the board once
        lists_data = self._make_request("GET", f"boards/{board_id}/lists", params={"fields": "id,name"})
        list_map = {lst["id"]: lst["name"] for lst in lists_data}
        
        # 2. Fetch all cards on the board
        params = {"fields": "all"}
        cards_data = self._make_request("GET", f"boards/{board_id}/cards", params=params)
        
        # 3. Process cards using the in-memory list map, returning full model data
        processed_cards = []
        for card_data in cards_data:
            list_name = list_map.get(card_data["idList"], "Unknown List")
            card_name = card_data["name"]
            if (
                not card_data.get("closed", False)
                and card_name != list_name
                and card_name not in EXCLUDED_CARD_NAMES
            ):
                card = TrelloCard.from_trello_json(card_data, list_name)
                processed_cards.append(card)
        return processed_cards
    
    def get_cards_from_multiple_boards(self, board_ids: List[str]) -> List[Dict[str, Any]]:
        """Get all cards from a list of board IDs."""
        all_cards = []
        for board_id in board_ids:
            cards = self.get_board_cards(board_id)
            all_cards.extend(cards)
        return all_cards
    
    def get_card_details(self, card_id: str) -> TrelloCard:
        """Get detailed information for a specific card."""
        logger.info(f"Fetching details for card: {card_id}")
        card_data = self._make_request("GET", f"cards/{card_id}", 
                                     params={"fields": "all"})
        # We need the list name, but get_card_details is called for a single card,
        # so a separate API call is acceptable here to get its list.
        list_info = self._make_request("GET", f"cards/{card_id}/list", params={"fields": "name"})
        card = TrelloCard.from_trello_json(card_data, list_info.get("name"))
        return card
    
    def export_cards_data(self, cards: List[TrelloCard], format: str = "json") -> Any:
        """Export cards in specified format."""
        if format == "json":
            return [card.model_dump() for card in cards]
        elif format == "csv":
            # Implement CSV export if needed
            raise NotImplementedError("CSV export not yet implemented")
        else:
            raise ValueError(f"Unsupported export format: {format}")

def get_trello_service() -> TrelloService:
    """Dependency injector for TrelloService."""
    return TrelloService() 