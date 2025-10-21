import { log } from '../utils/logger.js';

function createCardHTML(card, selectable = true, isSelected = false) {
    log(`Creating HTML for card: ${card.id} - ${card.name}`);
    
    return `
        <div class="card-item" data-card-id="${card.id}">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">${card.name || 'Unnamed Card'}</h5>
                        <small class="text-muted">
                            ${card.project || 'N/A'} | 
                            <span class="list-name">${card.list_name || 'N/A'}</span>
                        </small>
                        <div class="metadata-row mt-1">${renderLabels(card.labels)}</div>
                    </div>
                    ${selectable ? `
                        <div class="form-check high-contrast-checkbox d-flex align-items-center">
                            <input type="checkbox" class="form-check-input card-select me-2"
                                data-card-id="${card.id}" ${isSelected ? 'checked' : ''}>
                            ${card.isCustom ? `
                                <button class="btn btn-sm btn-outline-primary edit-card me-1" data-card-id="${card.id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-card" data-card-id="${card.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="card-body p-2">
                <div class="metadata-row">
                    <span class="metadata-item"><i class="bi bi-calendar"></i> ${card.due_date ? new Date(card.due_date).toLocaleDateString() : 'N/A'}</span>
                    <span class="metadata-item"><i class="bi bi-lightning"></i> ${card.effort || 'N/A'}</span>
                </div>
                <div class="metadata-row">
                    <span class="metadata-item"><i class="bi bi-people"></i> ${formatList(card.stakeholders || [])}</span>
                </div>
                <div class="technical-row">
                    <span class="repo-link">${formatRepo(card.github_repo)}</span>
                    <span class="impacted-assets">${formatList(card.impacted_assets || [])}</span>
                </div>
                ${card.description ? `
                    <div class="description-section mt-2">
                        ${marked.parse(card.description)}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderCards(cards, container, selectable = true, selectedCards = new Set()) {
    log(`Rendering ${cards.length} cards to container:`, container.id);
    container.innerHTML = '';
    cards.forEach(card => {
        const isSelected = selectedCards.has(card.id);
        const cardHTML = createCardHTML(card, selectable, isSelected);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        container.appendChild(tempDiv.firstElementChild);
    });
}

// Helper methods
function formatList(items) {
    if (!items || items.length === 0) return 'N/A';
    return items.map(item => `<span class="badge bg-light text-dark">${item}</span>`).join(' ');
}

function renderLabels(labels) {
    if (!labels || labels.length === 0) return 'No labels';
    return labels.map(label => `<span class="badge bg-${getLabelColor(label)} me-1">${label}</span>`).join('');
}

function getLabelColor(label) {
    const labelLower = label.toLowerCase();
    if (labelLower.includes('priority:')) {
        if (labelLower.includes('high')) return 'danger';
        if (labelLower.includes('medium')) return 'warning';
        return 'info';
    }
    if (labelLower.includes('type:')) return 'success';
    return 'secondary';
}

function formatRepo(repo) {
    if (!repo) return 'N/A';
    return `<a href="${repo}" target="_blank">${repo}</a>`;
}

export const CardDisplay = {
    renderCards,
    createCardHTML,
    helpers: {
        formatList,
        renderLabels,
        getLabelColor,
        formatRepo
    }
}; 