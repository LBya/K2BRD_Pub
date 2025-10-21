from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

from ..models.card import TrelloCard
from ..services.brd_service import BRDService, get_brd_service
from ..services.llm_service import LLMService, get_llm_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Pydantic Models for BRD Router ---

class GenerateBRDRequest(BaseModel):
    cards: List[TrelloCard]

# --- BRD Endpoints ---

@router.post("/generate")
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