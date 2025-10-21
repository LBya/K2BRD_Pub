class CustomCardManager {
    constructor() {
        this.customCards = new Map();
        this.cardCounter = 0;
    }

    createEmptyCard() {
        const cardId = `custom-${++this.cardCounter}`;
        const card = {
            id: cardId,
            name: 'New Card',
            project: '',
            list_name: '',
            due_date: '',
            effort: '',
            labels: [],
            stakeholders: [],
            github_repo: '',
            impacted_assets: [],
            description: '',
            isCustom: true
        };
        this.customCards.set(cardId, card);
        return card;
    }

    updateCard(cardId, updates) {
        // If card doesn't exist, create it
        if (!this.customCards.has(cardId)) {
            this.customCards.set(cardId, {
                ...updates,
                isCustom: true
            });
            console.log('Created new card:', cardId);
            return true;
        }
        
        // Update existing card
        const card = this.customCards.get(cardId);
        Object.assign(card, updates);
        console.log('Updated existing card:', cardId);
        return true;
    }

    getCard(cardId) {
        return this.customCards.get(cardId);
    }

    getAllCards() {
        return Array.from(this.customCards.values());
    }

    deleteCard(cardId) {
        return this.customCards.delete(cardId);
    }
}

export default CustomCardManager; 