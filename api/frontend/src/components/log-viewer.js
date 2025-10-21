import { log } from '../utils/logger.js';

const logViewerTemplate = document.createElement('template');
logViewerTemplate.innerHTML = `
    <style>
        /* Scoped styles for our component */
        .log-card {
            margin-bottom: 1rem;
        }
        .log-header {
            cursor: pointer; /* Indicates the header is clickable */
            user-select: none; /* Prevents text selection when clicking */
            padding: 0.75rem 1.25rem;
            background-color: #f7f7f9;
            border: 1px solid rgba(0,0,0,.125);
            border-radius: 0.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .log-header:hover {
            background-color: #e9ecef;
        }
        .log-body {
            border: 1px solid rgba(0,0,0,.125);
            border-top: none;
            padding: 1.25rem;
            border-bottom-left-radius: 0.25rem;
            border-bottom-right-radius: 0.25rem;
        }
        .logs-container {
            max-height: 150px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 0.8em;
            background-color: #fff;
            padding: 10px;
            border: 1px solid #ccc;
            white-space: pre-wrap;
        }
        .log-body.collapsed {
            display: none; /* The magic for collapsing */
        }
        .toggle-icon::before {
            content: '▲'; /* Up arrow for expanded */
            display: inline-block;
            transition: transform 0.2s ease-in-out;
        }
        .collapsed .toggle-icon::before {
            transform: rotate(180deg); /* Down arrow for collapsed */
        }
    </style>
    <div class="log-card">
        <div class="log-header" part="header">
            <div>
                <span part="title">System Logs</span>
                <span class="toggle-icon" part="icon"></span>
            </div>
            <button part="clear-button" class="btn btn-sm btn-outline-secondary">Clear</button>
        </div>
        <div class="log-body" part="body">
            <div id="logs" class="logs-container" part="log-container">
                <!-- Log entries will be added here -->
            </div>
        </div>
    </div>
`;

class LogViewer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(logViewerTemplate.content.cloneNode(true));

        this._isCollapsed = false;
    }

    connectedCallback() {
        const header = this.shadowRoot.querySelector('.log-header');
        const clearButton = this.shadowRoot.querySelector('[part="clear-button"]');
        
        header.addEventListener('click', (e) => {
            // Prevent clear button click from also toggling the collapse
            if (e.target.part.contains('clear-button')) return;
            this.toggle();
        });

        clearButton.addEventListener('click', () => this.clear());

        // Make the `addLog` method available globally for easy access from other scripts
        window.logViewer = this;
    }

    toggle() {
        this._isCollapsed = !this._isCollapsed;
        const body = this.shadowRoot.querySelector('.log-body');
        const header = this.shadowRoot.querySelector('.log-header');
        body.classList.toggle('collapsed', this._isCollapsed);
        header.classList.toggle('collapsed', this._isCollapsed);
    }

    addLog(message, type = 'info') {
        const logContainer = this.shadowRoot.querySelector('#logs');
        const logEntry = document.createElement('div');
        logEntry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        // Optional: Add color coding based on type
        if (type === 'error') {
            logEntry.style.color = 'red';
        }
        logContainer.appendChild(logEntry);
        // Auto-scroll to the bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    clear() {
        const logContainer = this.shadowRoot.querySelector('#logs');
        logContainer.innerHTML = '';
        log('Logs cleared.');
    }
}

// Define the custom element so the browser recognizes `<log-viewer>`
customElements.define('log-viewer', LogViewer); 