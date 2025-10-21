from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from .config.logging_config import setup_logging
from .models.card import TrelloCard
from .services.trello_service import TrelloService, get_trello_service, TrelloCardNotFoundError
from .services.llm_service import LLMService, get_llm_service
from .services.brd_service import BRDService, get_brd_service
from .config.core import settings
import logging
import uvicorn
from .api import health, trello, brd

# Setup logging before anything else
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME, 
    description="Automated Project Management API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CLIENT_ORIGIN, "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up logging
logger = logging.getLogger(__name__)

# --- Pydantic Models for Requests and Responses ---

class GetCardsRequest(BaseModel):
    card_ids: List[str]

class ExportRequest(BaseModel):
    board_ids: List[str]
    format: str = "json"

class GenerateBRDRequest(BaseModel):
    cards: List[TrelloCard]

# --- API Routers ---
app.include_router(health.router, prefix="/api/v1", tags=["Health & Debug"])
app.include_router(trello.router, prefix="/api/v1/trello", tags=["Trello"])
app.include_router(brd.router, prefix="/api/v1/brd", tags=["BRD"])

# --- API Endpoints ---

@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Check if the API is running."""
    return {"status": "ok"}

@app.get("/api/v1/boards", tags=["Trello"], response_model=List[Dict[str, Any]])
async def get_boards(trello_service: TrelloService = Depends(get_trello_service)):
    """Get all Trello boards for the authenticated user."""
    try:
        return trello_service.get_boards()
    except Exception as e:
        logger.error(f"Error fetching boards: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch Trello boards.")

@app.get("/api/v1/boards/{board_id}/cards", tags=["Trello"], response_model=List[TrelloCard])
async def get_board_cards(board_id: str, trello_service: TrelloService = Depends(get_trello_service)):
    """Get all cards from a specific Trello board."""
    try:
        cards = trello_service.get_board_cards(board_id)
        logger.info(f"Returning {len(cards)} cards for board {board_id}")
        return cards
    except Exception as e:
        logger.error(f"Error fetching cards for board {board_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch cards for board {board_id}.")

@app.post("/api/v1/cards", tags=["Trello"], response_model=List[TrelloCard])
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

@app.post("/api/v1/brd/generate", tags=["BRD"])
async def generate_brd(
    request: GenerateBRDRequest,
    brd_service: BRDService = Depends(get_brd_service),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Generate Business Requirement Document (BRD) for a list of cards."""
    if not llm_service.is_available():
        raise HTTPException(status_code=503, detail="LLM service is not available.")
    if not request.cards:
        raise HTTPException(status_code=400, detail="No card data provided for BRD generation.")
    
    try:
        return brd_service.generate_brd_for_cards(request.cards)
    except Exception as e:
        logger.error(f"Error generating BRD: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate BRD.")

@app.post("/api/v1/cards/export", tags=["Trello"])
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

@app.post("/api/v1/debug/log-selected-cards", tags=["Debug"])
async def log_selected_cards(request: Request):
    """Logs the selected card IDs from a request for debugging purposes."""
    try:
        data = await request.json()
        selected_card_ids = data.get("selectedCardIds", "No Data")
        logger.info(f"Debug - Selected Card IDs: {selected_card_ids}")
        return {"message": "Logged successfully"}
    except Exception as e:
        logger.error(f"Error in debug logging endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process debug log request.")

# Note: The label-mapping and label-config endpoints are omitted as they seemed to be placeholders.
# They can be added back here if their functionality is confirmed and implemented.
