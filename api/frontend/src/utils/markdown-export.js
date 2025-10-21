export class MarkdownExporter {
    static getFilename(tabName) {
        const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
        return `${tabName}_${date}.md`;
    }

    static async exportMarkdown(content, tabName) {
        try {
            const markdown = this.convertToMarkdown(content);
            const blob = new Blob([markdown], {type: 'text/markdown'});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = this.getFilename(tabName);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        }
    }

    static convertToMarkdown(content) {
        // If content is already markdown, return as is
        if (typeof content === 'string' && content.trim().startsWith('#')) {
            return content;
        }
        
        // Otherwise, parse it through marked
        return marked.parse(content);
    }
} 