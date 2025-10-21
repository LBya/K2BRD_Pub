import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import CardManager from '../../src/components/card-manager';
import CustomCardManager from '../../src/components/custom-card';
import { CardDisplay } from '../../src/components/card-display';

// Mock child components
vi.mock('../../src/components/custom-card', () => {
    return {
        default: vi.fn().mockImplementation(() => {
            return {
                getCard: vi.fn(),
                addCard: vi.fn(),
                deleteCard: vi.fn(),
                getAllCards: vi.fn().mockReturnValue([]),
            };
        })
    };
});

vi.mock('../../src/components/card-display', () => ({
    CardDisplay: {
        renderCards: vi.fn(),
    }
}));


describe('CardManager', () => {
    let dom;
    let cardManager;

    beforeEach(() => {
        // Setup a JSDOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <body>
                <button id="createCard"></button>
                <button id="generateBrd"></button>
                <div id="createCardForm" class="d-none"></div>
                <template id="card-editor-template">
                    <div class="card">
                        <div class="card-body">
                            <input data-field="name">
                            <div data-section="labels">
                                <button class="add-label"></button>
                            </div>
                            <div data-section="stakeholders">
                                 <button class="add-stakeholder"></button>
                            </div>
                             <div data-section="impacted_assets">
                                <button class="add-asset"></button>
                            </div>
                        </div>
                    </div>
                </template>
            </body>
        `);

        global.document = dom.window.document;
        global.window = dom.window;
        global.confirm = () => true;
        global.vi = vi;

        // Instantiate the class under test
        cardManager = new CardManager();
    });

    it('should render the create card form when toggleCreateCardForm is called', () => {
        const formContainer = document.getElementById('createCardForm');
        expect(formContainer.classList.contains('d-none')).toBe(true);

        // Simulate the toggle
        cardManager.toggleCreateCardForm();

        // Check that the form is visible and has content
        expect(formContainer.classList.contains('d-none')).toBe(false);
        expect(formContainer.innerHTML).not.toBe('');
        
        // Check for a specific element from the template
        const nameInput = formContainer.querySelector('input[data-field="name"]');
        expect(nameInput).not.toBeNull();
    });
}); 