import { MarkdownExporter } from '../utils/markdown-export.js';
import EasyMDE from 'easymde';

export class BRDTabManager {
    constructor() {
        this.tabs = new Map();
        this.editorInstances = new Map();
        this.activeTabId = null;
        this.tabCounter = 0;
        
        this.tabList = document.getElementById('brdTabs');
        this.tabContent = document.getElementById('brdTabContent');
        this.exportAllBtn = document.getElementById('exportAllBrd');
        
        this.setupEventListeners();
        
        this.updateExportAllButtonState();
    }

    setupEventListeners() {
        // Handle tab switching
        this.tabList.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                this.switchTab(e.target.dataset.tabId);
            }
        });

        // Handle tab close buttons
        this.tabList.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-tab')) {
                e.preventDefault();
                e.stopPropagation();
                this.closeTab(e.target.closest('.nav-item').dataset.tabId);
            }
        });
    }

    updateExportAllButtonState() {
        if (!this.exportAllBtn) return;
        this.exportAllBtn.disabled = this.tabs.size === 0;
    }

    async exportAllTabs() {
        if (this.tabs.size === 0) {
            if (window.logViewer) {
                window.logViewer.addLog('No tabs to export.', 'warning');
            }
            return;
        }
    
        if (window.logViewer) {
            window.logViewer.addLog(`Starting export of ${this.tabs.size} tabs...`);
        }
    
        let successCount = 0;
        for (const tabId of this.tabs.keys()) {
            const editor = this.editorInstances.get(tabId);
            const tab = this.tabs.get(tabId);

            if (editor && tab) {
                const content = editor.value();
                const success = await MarkdownExporter.exportMarkdown(content, tab.title);
                if (success) {
                    successCount++;
                }
            }
        }
    
        if (window.logViewer) {
            if (successCount === this.tabs.size) {
                window.logViewer.addLog(`Successfully exported all ${successCount} tabs.`);
            } else {
                window.logViewer.addLog(`Successfully exported ${successCount} of ${this.tabs.size} tabs.`, 'warning');
            }
        }
    }

    async exportTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        const editor = this.editorInstances.get(tabId);
        if (!editor) {
            this.addLog(`Could not find editor for tab ${tabId}`, 'error');
            return;
        }

        const content = editor.value();
        const tabName = document.querySelector(`[data-tab-id="${tabId}"] .nav-link`).textContent.trim();
        
        const success = await MarkdownExporter.exportMarkdown(content, tabName);
        
        if (success) {
            this.addLog(`Exported ${tabName} successfully`);
        } else {
            this.addLog(`Failed to export ${tabName}`, 'error');
        }
    }

    createTab(cardData) {
        const tabId = `brd-tab-${++this.tabCounter}`;
        const tabTitle = cardData.name || `BRD ${this.tabCounter}`;
    
        // Create tab button
        const tabButton = document.createElement('li');
        tabButton.className = 'nav-item';
        tabButton.dataset.tabId = tabId;
        tabButton.innerHTML = `
            <a class="nav-link" data-bs-toggle="tab" href="#${tabId}">
                ${tabTitle}
                <button class="btn-close close-tab ms-2" aria-label="Close"></button>
            </a>
        `;
    
        // Create tab content
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-pane fade';
        tabContent.id = tabId;
        tabContent.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="btn-group">
                    <button class="btn btn-outline-secondary btn-sm export-markdown">
                        <i class="bi bi-download"></i> Export Markdown
                    </button>
                    <button class="btn btn-secondary btn-sm copy-content">
                        <i class="bi bi-clipboard"></i> Copy
                    </button>
                </div>
            </div>
            <div class="editor-container" style="min-height: 400px; max-height: 70vh;">
                <textarea class="form-control h-100"></textarea>
            </div>
            <div class="preview-container d-none" style="min-height: 400px; max-height: 70vh;">
                <!-- Markdown preview will be rendered here -->
            </div>
        `;
    
        // Add to DOM
        this.tabList.appendChild(tabButton);
        this.tabContent.appendChild(tabContent);
    
        // Store tab data
        this.tabs.set(tabId, {
            id: tabId,
            title: tabTitle,
            cardId: cardData.id,
            content: '',
            isPreviewMode: false
        });
    
        // Initialize EasyMDE editor after DOM elements are added
        const textarea = tabContent.querySelector('textarea');
        const easyMDE = new EasyMDE({
            element: textarea,
            spellChecker: false,
            status: false,
            toolbar: [
                "bold", "italic", "heading", "|", 
                "quote", "unordered-list", "ordered-list", "|", 
                "link", "image", "|", 
                "preview", "side-by-side", "fullscreen", "|",
                {
                    name: "export-md",
                    action: (editor) => {
                        const content = editor.value();
                        const tab = this.tabs.get(tabId);
                        if (tab) {
                            MarkdownExporter.exportMarkdown(content, tab.title);
                        }
                    },
                    className: "fa fa-file-text-o",
                    title: "Export as Markdown (.md)",
                },
                {
                    name: "export-docx",
                    action: (editor) => {
                        try {
                            const content = editor.value();
                            const tab = this.tabs.get(tabId);
                            const fileName = tab ? `${tab.title}.docx` : 'document.docx';
    
                            // eslint-disable-next-line no-undef
                            if (typeof window.docx === 'undefined') {
                                console.error('docx library is not loaded!');
                                if (window.logViewer) window.logViewer.addLog('Error: DOCX library not loaded.', 'error');
                                return;
                            }
    
                            // eslint-disable-next-line no-undef
                            const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;
    
                            const doc = new Document({
                                sections: [{
                                    children: content.split('\n').map(line => {
                                        if (line.startsWith('# ')) {
                                            return new Paragraph({ text: line.substring(2), heading: HeadingLevel.HEADING_1 });
                                        }
                                        if (line.startsWith('## ')) {
                                            return new Paragraph({ text: line.substring(3), heading: HeadingLevel.HEADING_2 });
                                        }
                                        if (line.startsWith('### ')) {
                                            return new Paragraph({ text: line.substring(4), heading: HeadingLevel.HEADING_3 });
                                        }
                                        return new Paragraph({ children: [new TextRun(line)] });
                                    })
                                }]
                            });
    
                            Packer.toBlob(doc).then(blob => {
                                // eslint-disable-net-line no-undef
                                if (typeof window.saveAs === 'undefined') {
                                    console.error('FileSaver library is not loaded!');
                                    if (window.logViewer) window.logViewer.addLog('Error: FileSaver library not loaded.', 'error');
                                    return;
                                }
                                // eslint-disable-next-line no-undef
                                window.saveAs(blob, fileName);
                                if (window.logViewer) window.logViewer.addLog(`Successfully exported ${fileName}.`);
                            }).catch(err => {
                                console.error('Error packing DOCX:', err);
                                if (window.logViewer) window.logViewer.addLog(`Error exporting DOCX: ${err.message}`, 'error');
                            });
                        } catch (err) {
                            console.error('Failed to create DOCX:', err);
                            if (window.logViewer) window.logViewer.addLog(`Failed to create DOCX: ${err.message}`, 'error');
                        }
                    },
                    className: "fa fa-file-word-o",
                    title: "Export as Word (.docx)",
                },
                {
                    name: "print",
                    action: (editor) => {
                        const content = editor.value();
                        const htmlContent = marked.parse(content);
                        const tab = this.tabs.get(tabId);

                        const date = new Date();
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const formattedDate = `${year}${month}${day}`;
                        const printTitle = tab ? `${tab.title}_${formattedDate}` : `BRD_${formattedDate}`;

                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(`
                            <html>
                                <head>
                                    <title>${printTitle}</title>
                                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                                    <style>
                                        @media print {
                                            body { font-size: 12pt; }
                                            a[href]:after { content: none !important; }
                                            .btn { display: none; }
                                            @page { margin: 0.5in; }
                                        }
                                        body { padding: 1rem; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container-fluid">${htmlContent}</div>
                                    <script>
                                        window.onload = function() {
                                            setTimeout(function() { 
                                                window.print();
                                                window.onafterprint = function() {
                                                    window.close();
                                                }
                                            }, 500); // Wait for CSS to load
                                        }
                                    </script>
                                </body>
                            </html>
                        `);
                        printWindow.document.close();
                    },
                    className: "fa fa-print",
                    title: "Print BRD",
                },
                "|",
                "guide"
            ]
        });
        this.editorInstances.set(tabId, easyMDE);
    
        // Setup event listeners for this tab
        this.setupTabEventListeners(tabId);
        this.updateExportAllButtonState();
    
        return tabId;
    }
    

    setupTabEventListeners(tabId) {
        const tabPane = document.getElementById(tabId);
        const exportBtn = tabPane.querySelector('.export-markdown');
        const copyBtn = tabPane.querySelector('.copy-content');
        const easyMDEInstance = this.editorInstances.get(tabId);

        exportBtn.addEventListener('click', () => this.exportTab(tabId));
        copyBtn.addEventListener('click', () => this.copyContent(tabId));
        
        easyMDEInstance.codemirror.on("change", () => {
            this.saveTabContent(tabId);
        });
    }

    switchTab(tabId) {
        if (this.activeTabId) {
            // Save current tab content
            this.saveTabContent(this.activeTabId);
        }

        this.activeTabId = tabId;
        this.loadTabContent(tabId);
    }

    saveTabContent(tabId) {
        const tab = this.tabs.get(tabId);
        const editor = this.editorInstances.get(tabId);
        if (editor) {
            tab.content = editor.value();
        }
    }

    loadTabContent(tabId) {
        const tab = this.tabs.get(tabId);
        const editor = this.editorInstances.get(tabId);
        if (editor) {
            editor.value(tab.content);
        }
    }

    updateTabContent(tabId, content) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.content = content;
            const editor = this.editorInstances.get(tabId);
            if (editor) {
                editor.value(content);
            }
            if (tab.isPreviewMode && tabPane) {
                const preview = tabPane.querySelector('.preview-container');
                preview.innerHTML = marked.parse(content);
            }
        }
    }

    copyContent(tabId) {
        const editor = this.editorInstances.get(tabId);
        if (editor) {
            const content = editor.value();
            navigator.clipboard.writeText(content).then(() => {
                if (window.logViewer) {
                    window.logViewer.addLog('Content copied to clipboard');
                }
            }).catch(err => {
                console.error('Failed to copy content:', err);
                if (window.logViewer) {
                    window.logViewer.addLog('Failed to copy content', 'error');
                }
            });
        }
    }

    closeTab(tabId) {
        const tabButton = this.tabList.querySelector(`[data-tab-id="${tabId}"]`);
        const tabContent = document.getElementById(tabId);
        
        // Clean up EasyMDE instance to prevent memory leaks
        if (this.editorInstances.has(tabId)) {
            this.editorInstances.get(tabId).toTextArea(); // Reverts the textarea to its original state
            this.editorInstances.delete(tabId);
        }
        
        if (tabButton) tabButton.remove();
        if (tabContent) tabContent.remove();
        this.tabs.delete(tabId);

        if (this.activeTabId === tabId) {
            const firstTab = this.tabs.keys().next().value;
            if (firstTab) {
                this.switchTab(firstTab);
            } else {
                this.activeTabId = null;
            }
        }
        this.updateExportAllButtonState();
    }

    closeAllTabs() {
        const tabIds = Array.from(this.tabs.keys());
        tabIds.forEach(tabId => this.closeTab(tabId));
        this.updateExportAllButtonState();
    }
} 