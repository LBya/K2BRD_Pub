from fastapi import APIRouter, Request, HTTPException
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health", tags=["Health"])
async def health_check():
    """Check if the API is running."""
    return {"status": "ok"}

@router.post("/debug/log-selected-cards", tags=["Debug"])
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