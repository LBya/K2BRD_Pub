import { log, error } from '../utils/logger.js';
import { appState } from '../state.js';

class CardManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Create card button
        document.getElementById('createCard').addEventListener('click', () => this.toggleCreateCardForm());
        
        // Generate BRD button
        document.getElementById('generateBrd').addEventListener('click', () => this.generateBRD());
        
        // Export cards button
        document.getElementById('exportCards')?.addEventListener('click', () => this.exportSelectedCards());

        // Delegate events for dynamic buttons
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            if (target.classList.contains('add-label')) {
                log('Adding new label field');
                this.addField(target, 'labels', 'Label');
            } else if (target.classList.contains('add-stakeholder')) {
                log('Adding new stakeholder field');
                this.addField(target, 'stakeholders', 'Stakeholder');
            } else if (target.classList.contains('add-asset')) {
                log('Adding new asset field');
                this.addField(target, 'impacted_assets', 'Asset');
            } else if (target.classList.contains('remove-field')) {
                log('Removing field');
                target.closest('.input-group').remove();
            } else if (target.classList.contains('save-card')) {
                log('Saving card');
                e.preventDefault();
                this.saveNewCard(target.closest('#createCardForm'));
            } else if (target.classList.contains('edit-card')) {
                log('Editing card');
                const cardId = target.dataset.cardId;
                this.editCard(cardId);
            } else if (target.classList.contains('delete-card')) {
                log('Deleting card');
                const cardId = target.dataset.cardId;
                if (confirm('Are you sure you want to delete this card?')) {
                    this.deleteCard(cardId);
                }
            } else if (target.classList.contains('cancel-edit')) {
                log('Canceling card edit');
                const formContainer = document.getElementById('createCardForm');
                formContainer.classList.add('d-none');
                formContainer.innerHTML = '';
            }
        });
    }

    addField(button, fieldType, placeholder) {
        // Find the section container for this field type
        const section = button.closest('.card-body').querySelector(`.${fieldType}-section`);
        if (!section) {
            error(`Section for ${fieldType} not found`);
            return;
        }

        const newField = document.createElement('div');
        newField.className = 'input-group input-group-sm mb-1';
        newField.innerHTML = `
            <input type="text" class="form-control" placeholder="${placeholder}" data-field="${fieldType}">
            <button class="btn btn-outline-danger remove-field">
                <i class="bi bi-x"></i>
            </button>
        `;
        
        // Insert before the add button (which is the last child)
        const addButton = section.querySelector(`.add-${fieldType.replace('_', '-')}`);
        section.insertBefore(newField, addButton);
    }

    _renderCardForm(card = {}) {
        const template = document.getElementById('card-editor-template');
        if (!template) {
            error('Card editor template not found!');
            return null;
        }

        const formFragment = template.content.cloneNode(true);
        const formElement = formFragment.querySelector('.card');

        // Populate basic fields
        for (const field of ['name', 'project', 'list_name', 'due_date', 'effort', 'github_repo', 'description']) {
            const input = formElement.querySelector(`[data-field="${field}"]`);
            if (input) {
                // Format date for input field
                if (field === 'due_date' && card.due_date) {
                    input.value = new Date(card.due_date).toISOString().split('T')[0];
                } else {
                    input.value = card[field] || '';
                }
            }
        }

        // Populate list fields (labels, stakeholders, impacted_assets)
        for (const fieldType of ['labels', 'stakeholders', 'impacted_assets']) {
            const section = formElement.querySelector(`[data-section="${fieldType}"]`);
            const addButton = section.querySelector(`.add-${fieldType.replace('_', '-')}`);
            if (card[fieldType] && card[fieldType].length > 0) {
                card[fieldType].forEach(value => {
                    const newField = document.createElement('div');
                    newField.className = 'input-group input-group-sm mb-1';
                    newField.innerHTML = `
                        <input type="text" class="form-control" placeholder="${fieldType.slice(0, -1)}" data-field="${fieldType}" value="${value}">
                        <button class="btn btn-outline-danger remove-field"><i class="bi bi-x"></i></button>
                    `;
                    section.insertBefore(newField, addButton);
                });
            } else {
                 // Add one empty field for new cards
                 const newField = document.createElement('div');
                 newField.className = 'input-group input-group-sm mb-1';
                 newField.innerHTML = `
                     <input type="text" class="form-control" placeholder="${fieldType.slice(0, -1)}" data-field="${fieldType}">
                 `;
                 section.insertBefore(newField, addButton);
            }
        }
        
        // Set card ID for save button
        const saveButton = formElement.querySelector('.save-card');
        if (card.id) {
            saveButton.dataset.cardId = card.id;
        }

        return formElement;
    }

    toggleCreateCardForm() {
        const formContainer = document.getElementById('createCardForm');
        if (formContainer.classList.contains('d-none')) {
            log('Opening card form');
            const form = this._renderCardForm();
            if (form) {
                formContainer.innerHTML = '';
                formContainer.appendChild(form);
                formContainer.classList.remove('d-none');
            }
        } else {
            log('Closing card form');
            formContainer.classList.add('d-none');
            formContainer.innerHTML = '';
        }
    }

    editCard(cardId) {
        const card = appState.cards.find(c => c.id === cardId);
        if (!card) {
            error('Card not found in appState:', cardId);
            return;
        }
    
        const formContainer = document.getElementById('createCardForm');
        // Create a mutable copy for the form.
        const editableCard = { ...card };
    
        const form = this._renderCardForm(editableCard);

        if (form) {
            formContainer.innerHTML = '';
            formContainer.appendChild(form);
            formContainer.classList.remove('d-none');
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async saveNewCard(formContainer) {
        log('Collecting card data');
        const saveButton = formContainer.querySelector('.save-card');
        const cardId = saveButton.dataset.cardId || `custom-${Date.now()}`;
        
        const card = {
            id: cardId,
            name: formContainer.querySelector('[data-field="name"]').value,
            project: formContainer.querySelector('[data-field="project"]').value,
            list_name: formContainer.querySelector('[data-field="list_name"]').value,
            due_date: formContainer.querySelector('[data-field="due_date"]').value,
            effort: formContainer.querySelector('[data-field="effort"]').value,
            labels: Array.from(formContainer.querySelectorAll('[data-field="labels"]')).map(input => input.value).filter(Boolean),
            stakeholders: Array.from(formContainer.querySelectorAll('[data-field="stakeholders"]')).map(input => input.value).filter(Boolean),
            github_repo: formContainer.querySelector('[data-field="github_repo"]').value,
            impacted_assets: Array.from(formContainer.querySelectorAll('[data-field="impacted_assets"]')).map(input => input.value).filter(Boolean),
            description: formContainer.querySelector('[data-field="description"]').value,
            isCustom: true // Mark it as a custom card
        };

        log('Saving card to appState:', card);
        appState.addOrUpdateCard(card); // Use the new central state function
        this.toggleCreateCardForm(); // This will just hide the form
    }

    deleteCard(cardId) {
        log('Deleting card from appState:', cardId);
        appState.deleteCard(cardId); // Use the new central state function
    }

    async generateBRD() {
        log('Generate BRD button clicked');
        if (appState.selectedCards.size === 0) {
            alert('Please select at least one card to generate a BRD.');
            return;
        }

        log(`Preparing to generate BRD for ${appState.selectedCards.size} selected cards.`);

        // Get selected cards from the single source of truth
        const selectedCardsData = appState.cards.filter(card => appState.selectedCards.has(card.id));

        if (selectedCardsData.length === 0 && appState.selectedCards.size > 0) {
            error("Selection mismatch: IDs selected in state but no matching card objects found.");
            alert("An error occurred with card selection. Please refresh and try again.");
            return;
        }

        // Store the full card objects in session storage for the next page
        // The `isCustom` property is now part of the card object itself.
        sessionStorage.setItem('selectedCards', JSON.stringify(selectedCardsData));
        sessionStorage.setItem('selectedCardIds', JSON.stringify(Array.from(appState.selectedCards))); // Also store IDs for re-fetching if needed

        window.location.href = '/brd-generator.html';
    }

    exportSelectedCards() {
        if (appState.selectedCards.size === 0) {
            alert('Please select cards to export.');
            return;
        }

        const selectedCardsData = appState.cards.filter(card => appState.selectedCards.has(card.id));

        if (selectedCardsData.length > 0) {
            log('Exporting selected cards to markdown', selectedCardsData);
            this.convertCardsToMarkdown(selectedCardsData);
        } else {
            alert('No matching cards found for export.');
            error('Selected card IDs not found in the current card list.');
        }
    }

    convertCardsToMarkdown(cards) {
        if (!cards || cards.length === 0) {
            alert('No cards to export.');
            return;
        }

        const markdownContent = cards.map(card => {
            const dueDate = card.due_date ? new Date(card.due_date).toLocaleDateString() : 'N/A';
            return `
## ${card.name}
- **ID**: ${card.id}
- **Project**: ${card.project || 'N/A'}
- **List**: ${card.list_name || 'N/A'}
- **Due Date**: ${dueDate}
- **Effort**: ${card.effort || 'N/A'}
- **Labels**: ${card.labels ? card.labels.join(', ') : 'None'}
- **Stakeholders**: ${card.stakeholders ? card.stakeholders.join(', ') : 'None'}
- **Repo**: ${card.github_repo || 'N/A'}
- **Impacted Assets**: ${card.impacted_assets ? card.impacted_assets.join(', ') : 'None'}

**Description**: 
${card.description || 'No description provided.'}
---`;
        }).join('\n');

        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'selected-cards.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export default CardManager;