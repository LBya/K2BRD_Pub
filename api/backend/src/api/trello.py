from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..services.trello_service import TrelloService, get_trello_service, TrelloCardNotFoundError
from ..models.card import TrelloCard
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Pydantic Models for Trello Router ---

class GetCardsRequest(BaseModel):
    card_ids: List[str]

class ExportRequest(BaseModel):
    board_ids: List[str]
    format: str = "json"

# --- Trello Endpoints ---

@router.get("/boards", response_model=List[Dict[str, Any]])
async def get_boards(trello_service: TrelloService = Depends(get_trello_service)):
    """Get all Trello boards for the authenticated user."""
    try:
        return trello_service.get_boards()
    except Exception as e:
        logger.error(f"Error fetching boards: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch Trello boards.")

@router.get("/boards/{board_id}/cards", response_model=List[TrelloCard])
async def get_board_cards(board_id: str, trello_service: TrelloService = Depends(get_trello_service)):
    """Get all cards from a specific Trello board."""
    try:
        cards = trello_service.get_board_cards(board_id)
        logger.info(f"Returning {len(cards)} cards for board {board_id}")
        return cards
    except Exception as e:
        logger.error(f"Error fetching cards for board {board_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch cards for board {board_id}.")

@router.post("/cards", response_model=List[TrelloCard])
async def get_cards_by_id(request: GetCardsRequest, trello_service: TrelloService = Depends(get_trello_service)):
    """Get detailed information for a list of card IDs."""
    if not request.card_ids:
        raise HTTPException(status_code=400, detail="No card IDs provided.")
    try:
        cards = [trello_service.get_card_details(card_id) for card_id in request.card_ids]
        return cards
    except TrelloCardNotFoundError as e:
        logger.warning(f"Failed to find a card: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving cards by ID: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve card details.")

@router.post("/cards/export")
async def export_cards(
    request: ExportRequest,
    trello_service: TrelloService = Depends(get_trello_service)
):
    """Export cards from one or more boards in a specified format."""
    try:
        cards = trello_service.get_cards_from_multiple_boards(request.board_ids)
        return trello_service.export_cards_data(cards, request.format)
    except Exception as e:
        logger.error(f"Error exporting cards: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export cards.") 