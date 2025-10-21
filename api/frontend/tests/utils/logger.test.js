import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Logger', () => {
    let log, error;

    beforeEach(async () => {
        // Mock console methods
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Reset modules to test different import.meta.env states
        vi.resetModules();
    });

    it('should call console.log when import.meta.env.DEV is true', async () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const loggerModule = await import('../../src/utils/logger.js');
        log = loggerModule.log;

        log('test message');
        expect(console.log).toHaveBeenCalledWith('[LOG]', 'test message');
    });

    it('should NOT call console.log when import.meta.env.DEV is false', async () => {
        vi.stubGlobal('import.meta', { env: { DEV: false } });
        const loggerModule = await import('../../src/utils/logger.js');
        log = loggerModule.log;
        
        log('test message');
        expect(console.log).not.toHaveBeenCalled();
    });

    it('should call console.error when import.meta.env.DEV is true', async () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const loggerModule = await import('../../src/utils/logger.js');
        error = loggerModule.error;

        error('test error');
        expect(console.error).toHaveBeenCalledWith('[ERROR]', 'test error');
    });
}); 