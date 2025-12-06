import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { randomBytes } from 'crypto';

export interface TelemetryWriterOptions {
    storeDiffs?: boolean;
    storeSnapshots?: boolean;
    baseDir?: string;
}

interface PersistRequest {
    kind: 'events' | 'diffs' | 'snapshots';
    label: string;
    payload: any;
}

export class TelemetryService {
    private readonly baseDir: string;

    constructor(
        private readonly enabled: boolean,
        private readonly options: TelemetryWriterOptions = {}
    ) {
        this.baseDir = options.baseDir || join(process.cwd(), 'logs', 'telemetry');
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    log(event: string, data?: any): Promise<void> {
        if (!this.enabled) return Promise.resolve();
        return this.persist({
            kind: 'events',
            label: event,
            payload: { event, timestamp: new Date().toISOString(), data }
        });
    }

    metric(name: string, value?: number): Promise<void> {
        if (!this.enabled) return Promise.resolve();
        return this.persist({
            kind: 'events',
            label: `metric_${name}`,
            payload: { type: 'metric', name, value, timestamp: new Date().toISOString() }
        });
    }

    diff(label: string, schemaA: any, schemaB: any, meta?: any): Promise<void> {
        if (!this.enabled || !this.options.storeDiffs) return Promise.resolve();
        return this.persist({
            kind: 'diffs',
            label,
            payload: {
                label,
                timestamp: new Date().toISOString(),
                meta,
                schemaA,
                schemaB
            }
        });
    }

    snapshot(label: string, payload: any): Promise<void> {
        if (!this.enabled || !this.options.storeSnapshots) return Promise.resolve();
        return this.persist({
            kind: 'snapshots',
            label,
            payload: { label, timestamp: new Date().toISOString(), payload }
        });
    }

    private async persist(request: PersistRequest): Promise<void> {
        if (!this.enabled) return;
        try {
            const target = this.resolveFilePath(request.kind, request.label);
            await fs.mkdir(dirname(target), { recursive: true });
            await fs.writeFile(target, JSON.stringify(request.payload, null, 2), 'utf-8');
        } catch (err) {
            console.warn('[Telemetry] Persist failed:', err);
        }
    }

    private resolveFilePath(kind: PersistRequest['kind'], label: string): string {
        const now = new Date();
        const dateDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const timeStamp = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
        const sanitized = label.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 48) || 'event';
        const random = randomBytes(4).toString('hex');
        const fileName = `${timeStamp}_${sanitized}_${random}.json`;
        return join(this.baseDir, kind, dateDir, fileName);
    }
}
