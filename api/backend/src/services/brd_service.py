from .trello_service import TrelloService, get_trello_service
from .llm_service import LLMService, get_llm_service
from ..models.card import TrelloCard
from typing import Dict, Any, List
from fastapi import Depends
from ..utils.text_cleaner import clean_text

class BRDService:
    def __init__(self, trello_service: TrelloService, llm_service: LLMService):
        self.trello_service = trello_service
        self.llm_service = llm_service

    def generate_brd_for_cards(self, cards: List[TrelloCard]) -> List[Dict[str, Any]]:
        """Generate BRD for a list of cards."""
        results = []
        for card in cards:
            # Clean all string-based inputs before sending to LLM
            cleaned_description = clean_text(card.description)
            
            context = {
                "project": clean_text(card.project),
                "effort": clean_text(card.effort),
                "stakeholders": [clean_text(s) for s in card.stakeholders if isinstance(s, str)],
                "github_repo_url": clean_text(card.github_repo),
                "impacted_assets_list": [clean_text(a) for a in card.impacted_assets if isinstance(a, str)],
                "type": clean_text(card.type),
                "priority": clean_text(card.priority),
            }
            
            # Remove keys with None or empty values to keep the prompt clean
            cleaned_context = {k: v for k, v in context.items() if v is not None and v != '' and v != []}

            brd_text = self.llm_service.generate_brd(cleaned_description, cleaned_context)
            
            results.append({
                "card": card.model_dump(),
                "brd": brd_text
            })
        return results

def get_brd_service(
    trello_service: TrelloService = Depends(get_trello_service),
    llm_service: LLMService = Depends(get_llm_service)
) -> BRDService:
    """Dependency injector for BRDService."""
    return BRDService(trello_service, llm_service) 