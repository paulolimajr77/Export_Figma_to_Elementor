/**
 * File Logger for Figma Plugin
 *
 * Escreve logs em um buffer interno para exportação posterior sem precisar
 * modificar o objeto global `console`.
 */
export class FileLogger {
    private logs: string[] = [];
    private sessionStart: string;
    private maxLogs: number = 1000; // Prevent memory issues
    private originalLog: (...args: any[]) => void;

    constructor(originalConsoleLog?: (...args: any[]) => void) {
        this.originalLog = originalConsoleLog || console.log.bind(console);
        this.sessionStart = new Date().toISOString();
        this.log('='.repeat(80));
        this.log(`[SESSION START] ${this.sessionStart}`);
        this.log('='.repeat(80));
    }

    /**
     * Log a message (replaces console.log)
     */
    log(...args: any[]): void {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');

        const logEntry = `[${timestamp}] ${message}`;

        // Add to memory buffer
        this.logs.push(logEntry);

        // Keep only last N logs to prevent memory issues
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Also log to original console for immediate feedback (NO RECURSION)
        this.originalLog(...args);
    }

    /**
     * Get all logs as a single string
     */
    getLogs(): string {
        return this.logs.join('\n');
    }

    /**
     * Save logs to a file (called from UI)
     */
    saveToFile(): string {
        const content = this.getLogs();
        const filename = `test-logs-${this.sessionStart.replace(/:/g, '-').split('.')[0]}.txt`;

        // In Figma plugin, we can't directly write files
        // Instead, we return the content to be saved via UI
        return content;
    }

    /**
     * Clear all logs
     */
    clear(): void {
        this.logs = [];
        this.sessionStart = new Date().toISOString();
        this.log('='.repeat(80));
        this.log(`[SESSION CLEARED] ${this.sessionStart}`);
        this.log('='.repeat(80));
    }

    /**
     * Add a test marker
     */
    startTest(testName: string): void {
        this.log('');
        this.log('═'.repeat(80));
        this.log(`TEST START: ${testName}`);
        this.log('═'.repeat(80));
    }

    /**
     * End test marker
     */
    endTest(testName: string, passed: boolean): void {
        this.log('─'.repeat(80));
        this.log(`TEST END: ${testName} - ${passed ? '✅ PASSED' : '❌ FAILED'}`);
        this.log('═'.repeat(80));
        this.log('');
    }
}

let patchedConsoleLog: ((...args: any[]) => void) | null = null;

/**
 * Opcionalmente encaminha console.log para o logger informado.
 * Mantemos referência ao console original para permitir restauração.
 */
export function patchConsoleLogger(logger: FileLogger): void {
    if (!patchedConsoleLog) {
        patchedConsoleLog = console.log.bind(console);
    }
    console.log = (...args: any[]) => logger.log(...args);
}

/**
 * Restaura o console.log original, se ele tiver sido alterado.
 */
export function restoreConsoleLogger(): void {
    if (patchedConsoleLog) {
        console.log = patchedConsoleLog;
        patchedConsoleLog = null;
    }
}
