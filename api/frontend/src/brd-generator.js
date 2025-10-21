import { API_BASE_URL } from './config.js';
import { log, error } from './utils/logger.js';
import { CardDisplay } from './components/card-display.js';
import { BRDTabManager } from './components/brd-tabs.js';
import './components/log-viewer.js';
import EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';

class BRDGenerator {
    constructor() {
        this.selectedCards = [];
        this.brdTabManager = new BRDTabManager('brdTabs', 'brdTabContent');
        this.loadSelectedCards();
        this.setupEventListeners();
    }

    async loadSelectedCards() {
        // First, try to get the full card objects directly
        const storedCards = sessionStorage.getItem('selectedCards');
        if (storedCards) {
            try {
                this.selectedCards = JSON.parse(storedCards);
                log('Loaded full card objects from session storage:', this.selectedCards);
                this.displaySelectedCards();
                return; // We are done, no need to fetch
            } catch (e) {
                error("Failed to parse full card objects from session storage, will try fetching by ID.", e);
            }
        }

        // Fallback: If full objects aren't there, fetch by ID
        const storedCardIds = sessionStorage.getItem('selectedCardIds');
        if (storedCardIds) {
            try {
                const cardIds = JSON.parse(storedCardIds);
                if (cardIds && cardIds.length > 0) {
                    const response = await fetch(`${API_BASE_URL}/api/v1/cards`, { // Use the /api/v1/cards endpoint
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ card_ids: cardIds }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch card details by ID');
                    }
                    this.selectedCards = await response.json();
                    log('Loaded cards by fetching IDs:', this.selectedCards);
                    this.displaySelectedCards();
                }
            } catch (err) {
                error('Error loading cards by ID:', err);
                this.selectedCards = [];
            }
        }
    }

    setupEventListeners() {
        document.getElementById('generateBrd')?.addEventListener('click', () => this.handleGenerateBRD());
        document.getElementById('exportAllBrd')?.addEventListener('click', () => this.brdTabManager.exportAllTabs());
    }

    displaySelectedCards() {
        const container = document.getElementById('selectedCardsPreview');
        if (!container) return;

        // Use CardDisplay to render the cards
        CardDisplay.renderCards(this.selectedCards, container, false);
    }

    displayGeneratedBRDs(brdResults) {
        // Clear any existing tabs
        this.brdTabManager.closeAllTabs(); 
    
        // `brdResults` is now the direct array from the backend
        brdResults.forEach(result => {
            // The result object now contains 'card' and 'brd'
            const tabId = this.brdTabManager.createTab(result.card);
            this.brdTabManager.updateTabContent(tabId, result.brd);
        });
    
        // Automatically switch to the first new tab
        if (this.brdTabManager.tabs.size > 0) {
            const firstTabId = this.brdTabManager.tabs.keys().next().value;
            if (firstTabId) {
                this.brdTabManager.switchTab(firstTabId);
            }
        }
    }

    async handleGenerateBRD() {
        if (this.selectedCards.length === 0) {
            alert("Please select cards to generate BRD.");
            return;
        }
        window.logViewer.addLog('Starting BRD generation...');

        const generateBtn = document.getElementById('generateBrd');
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...`;

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/brd/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cards: this.selectedCards }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server error: ${response.status} ${errorData.detail || ''}`);
            }
    
            const brdResults = await response.json();
            this.displayGeneratedBRDs(brdResults); // Call the display function
            window.logViewer.addLog(`Successfully generated ${brdResults.length} BRDs.`);
    
        } catch (err) {
            window.logViewer.addLog(`An error occurred during BRD generation: ${err.message}`, 'error');
            error('BRD Generation failed:', err);
            alert(`An error occurred: ${err.message}. Check the console for details.`);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `<i class="bi bi-magic"></i> Generate BRD`;
        }
    }

    generateBRDContent() {
        return this.selectedCards.map(card => {
            // Handle both date string and Date object formats
            const dueDate = card.due_date ? 
                (card.due_date instanceof Date ? 
                    card.due_date.toLocaleDateString() : 
                    new Date(card.due_date).toLocaleDateString()
                ) : 'N/A';

            return `
# ${card.name}

## Overview
- Project: ${card.project || 'N/A'}
- List: ${card.list_name || 'N/A'}
- Due Date: ${dueDate}
- Effort: ${card.effort || 'N/A'}

## Details
- Labels: ${Array.isArray(card.labels) ? card.labels.join(', ') : 'None'}
- Stakeholders: ${Array.isArray(card.stakeholders) ? card.stakeholders.join(', ') : 'None'}
- Repository: ${card.github_repo || 'N/A'}
- Impacted Assets: ${Array.isArray(card.impacted_assets) ? card.impacted_assets.join(', ') : 'None'}

## Description
${card.description || 'No description provided.'}
`}).join('\n\n---\n\n');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.brdGenerator = new BRDGenerator();
});
