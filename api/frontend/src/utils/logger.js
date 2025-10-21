// In a real app, this would be based on environment variables.
// Vite provides `import.meta.env.DEV` for this purpose.
const IS_DEV_MODE = import.meta.env.DEV;

/**
 * A simple logger utility that only logs messages in development mode.
 * 
 * @param {...any} args - The arguments to log.
 */
export function log(...args) {
    if (import.meta.env.DEV) {
        console.log('[LOG]', ...args);
    }
}

/**
 * A simple error logger that only logs messages in development mode.
 * In a real app, this might also send errors to a monitoring service.
 * 
 * @param {...any} args - The arguments to log.
 */
export function error(...args) {
    if (import.meta.env.DEV) {
        console.error('[ERROR]', ...args);
    }
    // Example: sendToMonitoringService(args);
} 