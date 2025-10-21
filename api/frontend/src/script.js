import { API_BASE_URL } from './config.js';
import { appState } from './state.js';
import { CardDisplay } from './components/card-display.js';
import { log, error } from './utils/logger.js';
import CardManager from './components/card-manager.js';
import './components/log-viewer.js';

document.addEventListener('DOMContentLoaded', function() {
    const cardManager = new CardManager();
    // --- DOM Elements ---
    const getBoardsButton = document.getElementById('getBoards');
    const getCardsButton = document.getElementById('getCards');
    const boardsList = document.getElementById('boardsList');
    const cardsList = document.getElementById('cardsList');
    const searchInput = document.getElementById('searchInput');
    const continueButton = document.getElementById('continueToBrd');

    // --- Render Functions ---
    function renderBoards() {
        if (!boardsList || !getCardsButton) return;
        boardsList.innerHTML = '';
        appState.boards.forEach(board => {
            const boardItem = document.createElement('div');
            boardItem.className = `board-item ${appState.selectedBoardIds.has(board.id) ? 'selected' : ''}`;
            boardItem.innerHTML = `<strong>${board.name}</strong><br><small>ID: ${board.id}</small>`;
            boardItem.addEventListener('click', () => appState.toggleBoardSelection(board.id));
            boardsList.appendChild(boardItem);
        });
        getCardsButton.disabled = appState.selectedBoardIds.size === 0;
    }

    function renderCards() {
        if (!searchInput || !cardsList) return;

        const searchTerm = searchInput.value.toLowerCase();
        const filteredCards = appState.cards.filter(card => 
            card.name.toLowerCase().includes(searchTerm) ||
            (card.project && card.project.toLowerCase().includes(searchTerm)) ||
            card.labels.some(label => label.toLowerCase().includes(searchTerm))
        );

        if (filteredCards.length === 0) {
            cardsList.innerHTML = ''; // Clear skeletons or old cards.
            let message = "No cards found in the selected boards."; // Default message
            if (searchInput.value) {
                message = `No cards found for your search "${searchInput.value}".`;
            } else if (appState.selectedBoardIds.size === 0) {
                message = "Select one or more boards on the left and click 'Get All Cards'.";
            }
            cardsList.innerHTML = `<div class="empty-state">${message}</div>`;
            return;
        }

        cardsList.innerHTML = '';
        CardDisplay.renderCards(filteredCards, cardsList, true, appState.selectedCards);
    }

    function renderContinueButton() {
        if (continueButton) {
            continueButton.classList.toggle('d-none', appState.selectedCards.size === 0);
        }
    }
    
    // --- Reusable UI Helpers ---
    function setButtonLoadingState(button, isLoading) {
        if (!button) return;
        const originalContent = button.dataset.originalContent || button.innerHTML;
        if (isLoading) {
            if (!button.dataset.originalContent) {
                button.dataset.originalContent = button.innerHTML;
            }
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`;
        } else {
            button.disabled = false;
            button.innerHTML = originalContent;
        }
    }
    
    // --- Event Listeners ---
    if (getBoardsButton) {
        getBoardsButton.addEventListener('click', async () => {
            appState.setLoading(true);
            window.logViewer.addLog('Fetching boards...');
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/boards`);
                if (!response.ok) throw new Error('Failed to fetch boards');
                const boards = await response.json();
                appState.setBoards(boards);
                window.logViewer.addLog(`Retrieved ${boards.length} boards successfully`);
            } catch (e) {
                window.logViewer.addLog(e.message, 'error');
                appState.setError(e.message);
                error('Error fetching boards:', e);
            } finally {
                appState.setLoading(false);
            }
        });
    }

    if (getCardsButton) {
        getCardsButton.addEventListener('click', async () => {
            if (appState.selectedBoardIds.size === 0) {
                window.logViewer.addLog('Please select at least one board', 'error');
                return;
            }

            // Show skeleton loaders
            cardsList.innerHTML = '';
            for (let i = 0; i < 8; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'skeleton-card';
                cardsList.appendChild(skeleton);
            }

            setButtonLoadingState(getCardsButton, true);
            appState.setLoading(true);
            window.logViewer.addLog(`Fetching cards for ${appState.selectedBoardIds.size} boards...`);
            try {
                // Create array of fetch promises for parallel execution
                const fetchPromises = [];
                for (const boardId of appState.selectedBoardIds) {
                    const fetchPromise = fetch(`${API_BASE_URL}/api/v1/boards/${boardId}/cards`)
                        .then(response => {
                            if (!response.ok) {
                                console.error(`Failed to fetch cards for board ${boardId}`);
                                window.logViewer.addLog(`Failed to fetch cards for board ${boardId}`, 'error');
                                return { cards: [] }; // Return empty result to prevent crash
                            }
                            return response.json();
                        })
                        .catch(error => {
                            console.error(`Error fetching cards for board ${boardId}:`, error);
                            window.logViewer.addLog(`Error fetching cards for board ${boardId}: ${error.message}`, 'error');
                            return []; // Return empty array on error
                        });
                    fetchPromises.push(fetchPromise);
                }

                // Execute all fetch operations in parallel
                const results = await Promise.all(fetchPromises);
                
                // Combine all cards from successful requests
                const allCards = results.flatMap(result => Array.isArray(result) ? result : result.cards || []);
                
                appState.setCards(allCards);
                window.logViewer.addLog(`Retrieved ${allCards.length} cards successfully`);
            } catch (e) {
                window.logViewer.addLog(e.message, 'error');
                appState.setError(e.message);
                error('Error fetching cards:', e);
            } finally {
                appState.setLoading(false);
                setButtonLoadingState(getCardsButton, false);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderCards);
    }
    
    if (cardsList) {
        cardsList.addEventListener('change', (e) => {
            if (e.target.classList.contains('card-select')) {
                const cardId = e.target.dataset.cardId;
                appState.toggleCardSelection(cardId);
            }
        });
    }

    document.getElementById('generateBrd')?.addEventListener('click', () => {
        const selectedCards = appState.cards.filter(card => appState.selectedCards.has(card.id));
        if (selectedCards.length === 0) {
            alert("Please select at least one card to generate a BRD.");
            return;
        }

        // Store the full card objects in session storage
        sessionStorage.setItem('selectedCards', JSON.stringify(selectedCards));
        
        // Redirect to the BRD generator page
        window.location.href = '/brd-generator.html';
    });

    // --- Initial Setup & State Subscription ---
    function rerender() {
        renderBoards();
        renderCards();
        renderContinueButton();
        // Could also render a loading spinner based on appState.isLoading
    }

    appState.addEventListener(rerender);

    // Initial render
    rerender(); 
}); 
