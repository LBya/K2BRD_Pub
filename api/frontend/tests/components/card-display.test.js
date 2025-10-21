import { describe, it, expect } from 'vitest';
import { CardDisplay } from '../../src/components/card-display';

const { formatList, renderLabels, getLabelColor, formatRepo } = CardDisplay.helpers;

describe('CardDisplay Helpers', () => {
    it('formatList should return N/A for empty lists', () => {
        expect(formatList([])).toBe('N/A');
        expect(formatList(null)).toBe('N/A');
    });

    it('formatList should format items into badges', () => {
        const items = ['User1', 'User2'];
        const expected = '<span class="badge bg-light text-dark">User1</span> <span class="badge bg-light text-dark">User2</span>';
        expect(formatList(items)).toBe(expected);
    });

    it('getLabelColor should return correct colors for priority labels', () => {
        expect(getLabelColor('priority: high')).toBe('danger');
        expect(getLabelColor('priority: medium')).toBe('warning');
        expect(getLabelColor('priority: low')).toBe('info');
    });
    
    it('getLabelColor should return success for type labels', () => {
        expect(getLabelColor('type: bug')).toBe('success');
    });

    it('formatRepo should return a link for a valid repo', () => {
        const repo = 'https://github.com/user/repo';
        const expected = `<a href="${repo}" target="_blank">${repo}</a>`;
        expect(formatRepo(repo)).toBe(expected);
    });

    it('formatRepo should return N/A for a missing repo', () => {
        expect(formatRepo(null)).toBe('N/A');
    });
}); 