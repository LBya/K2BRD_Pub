/**
 * A simple, centralized state management object for the K2BRD application.
 * This acts as the single source of truth for UI state.
 */
export const appState = {
    // Raw data from the backend
    boards: [],
    cards: [],

    // UI state
    selectedBoardIds: new Set(),
    selectedCards: new Set(),
    isLoading: false,
    error: null,

    // A simple event listener system to notify components of changes.
    _listeners: [],

    addEventListener(callback) {
        this._listeners.push(callback);
    },

    _notify() {
        this._listeners.forEach(callback => callback());
    },

    // --- Mutations ---

    setBoards(boards) {
        this.boards = boards;
        this._notify();
    },

    setCards(cards) {
        // This should now completely replace the existing cards
        this.cards = cards;
        this._notify();
    },

    addOrUpdateCard(card) {
        const index = this.cards.findIndex(c => c.id === card.id);
        if (index > -1) {
            // Update existing card
            this.cards[index] = card;
        } else {
            // Add new card
            this.cards.push(card);
        }
        this._notify();
    },

    deleteCard(cardId) {
        this.cards = this.cards.filter(c => c.id !== cardId);
        // Also remove it from selection if it was selected
        if (this.selectedCards.has(cardId)) {
            this.selectedCards.delete(cardId);
        }
        this._notify();
    },

    toggleBoardSelection(boardId) {
        if (this.selectedBoardIds.has(boardId)) {
            this.selectedBoardIds.delete(boardId);
        } else {
            this.selectedBoardIds.add(boardId);
        }
        this._notify();
    },

    toggleCardSelection(cardId) {
        if (this.selectedCards.has(cardId)) {
            this.selectedCards.delete(cardId);
        } else {
            this.selectedCards.add(cardId);
        }
        this._notify();
    },
    
    setLoading(isLoading) {
        this.isLoading = isLoading;
        this._notify();
    },

    setError(error) {
        this.error = error;
        this._notify();
    }
}; 