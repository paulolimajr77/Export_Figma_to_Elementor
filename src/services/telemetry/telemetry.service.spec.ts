import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { TelemetryService } from './telemetry.service';

const TEST_DIR = join(process.cwd(), 'logs', 'telemetry-tests');

async function exists(path: string): Promise<boolean> {
    try {
        await fs.stat(path);
        return true;
    } catch {
        return false;
    }
}

async function readKind(kind: string): Promise<string[]> {
    try {
        const dir = join(TEST_DIR, kind);
        const dates = await fs.readdir(dir);
        const files = await Promise.all(dates.map(async date => {
            const items = await fs.readdir(join(dir, date));
            return items.map(item => join(dir, date, item));
        }));
        return files.flat();
    } catch {
        return [];
    }
}

describe('TelemetryService', () => {
    beforeEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
    });

    afterEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    it('no-ops when disabled', async () => {
        const telemetry = new TelemetryService(false, { baseDir: TEST_DIR });
        await telemetry.log('disabled_event');
        expect(await exists(TEST_DIR)).toBe(false);
    });

    it('writes log file when enabled', async () => {
        const telemetry = new TelemetryService(true, { baseDir: TEST_DIR });
        await telemetry.log('event_enabled', { foo: 'bar' });
        const files = await readKind('events');
        expect(files.length).toBe(1);
        const content = JSON.parse(await fs.readFile(files[0], 'utf-8'));
        expect(content.event).toBe('event_enabled');
        expect(content.data.foo).toBe('bar');
    });

    it('only writes diff when storeDiffs=true', async () => {
        const telemetry = new TelemetryService(true, { baseDir: TEST_DIR, storeDiffs: true });
        await telemetry.diff('schema', { a: 1 }, { b: 2 }, { meta: true });
        const files = await readKind('diffs');
        expect(files.length).toBe(1);
        const payload = JSON.parse(await fs.readFile(files[0], 'utf-8'));
        expect(payload.schemaA.a).toBe(1);
        expect(payload.schemaB.b).toBe(2);
        expect(payload.meta.meta).toBe(true);
    });

    it('does not write diff when storeDiffs=false', async () => {
        const telemetry = new TelemetryService(true, { baseDir: TEST_DIR, storeDiffs: false });
        await telemetry.diff('schema', { a: 1 }, { b: 2 });
        const files = await readKind('diffs');
        expect(files.length).toBe(0);
    });

    it('only writes snapshot when storeSnapshots=true', async () => {
        const telemetry = new TelemetryService(true, { baseDir: TEST_DIR, storeSnapshots: true });
        await telemetry.snapshot('schema', { foo: 'bar' });
        const files = await readKind('snapshots');
        expect(files.length).toBe(1);
        const payload = JSON.parse(await fs.readFile(files[0], 'utf-8'));
        expect(payload.payload.foo).toBe('bar');
    });

    it('swallows fs errors', async () => {
        const telemetry = new TelemetryService(true, { baseDir: TEST_DIR });
        vi.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('fail'));
        await expect(telemetry.log('broken')).resolves.toBeUndefined();
    });
});
