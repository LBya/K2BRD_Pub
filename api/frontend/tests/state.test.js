import { describe, it, expect, vi } from 'vitest';
import { appState } from '../src/state';

describe('appState', () => {
    it('should set boards and notify listeners', () => {
        const listener = vi.fn();
        appState.addEventListener(listener);
        const newBoards = [{ id: '1', name: 'Board 1' }];

        appState.setBoards(newBoards);

        expect(appState.boards).toEqual(newBoards);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should toggle board selection and notify listeners', () => {
        const listener = vi.fn();
        appState.addEventListener(listener);
        const boardId = 'board1';

        appState.toggleBoardSelection(boardId);
        expect(appState.selectedBoardIds.has(boardId)).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);

        appState.toggleBoardSelection(boardId);
        expect(appState.selectedBoardIds.has(boardId)).toBe(false);
        expect(listener).toHaveBeenCalledTimes(2);
    });
    
    it('should set loading state and notify listeners', () => {
        const listener = vi.fn();
        appState.addEventListener(listener);

        appState.setLoading(true);
        expect(appState.isLoading).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);

        appState.setLoading(false);
        expect(appState.isLoading).toBe(false);
        expect(listener).toHaveBeenCalledTimes(2);
    });
}); 