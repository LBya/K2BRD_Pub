class CompactCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    set cardData(data) {
        this.render(data);
    }

    render(card) {
        this.shadowRoot.innerHTML = `
            <style>
                .compact-card {
                    border: 1px solid #ddd;
                    margin-bottom: 8px;
                    padding: 8px;
                }
                .header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .metadata-row {
                    display: flex;
                    gap: 12px;
                    margin-top: 4px;
                    font-size: 0.9em;
                }
                .label {
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.8em;
                }
            </style>
            <div class="compact-card">
                <div class="header-row">
                    <div>
                        <strong>${card.name}</strong>
                        <span class="text-muted">(${card.list_name})</span>
                    </div>
                    <input type="checkbox" class="card-select" data-card-id="${card.id}">
                </div>
                <div class="metadata-row">
                    <span>📅 ${card.due_date ? new Date(card.due_date).toLocaleDateString() : 'No due date'}</span>
                    <span>⚡ ${card.effort || 'No effort'}</span>
                    <span>👥 ${card.stakeholders.join(', ') || 'No stakeholders'}</span>
                </div>
                <div class="metadata-row">
                    ${this.renderLabels(card.mapped_labels)}
                </div>
            </div>
        `;
    }

    renderLabels(mappedLabels) {
        return Object.entries(mappedLabels)
            .map(([category, value]) => `
                <span class="label" style="background-color: ${this.getLabelColor(category)}">
                    ${category}: ${value}
                </span>
            `)
            .join('');
    }

    getLabelColor(category) {
        const colors = {
            type: '#28a745',
            priority: '#dc3545',
            status: '#17a2b8'
        };
        return colors[category] || '#6c757d';
    }
}

customElements.define('compact-card', CompactCard); 