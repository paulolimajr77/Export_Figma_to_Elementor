import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testConnection } from '../api_gemini';

describe('Gemini testConnection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).figma = {
      clientStorage: {
        getAsync: async (k: string) => (k === 'gemini_api_key' ? 'fake-key' : null)
      }
    } as any;
  });

  it('retorna sucesso quando API responde 200', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({}) })) as any;
    const res = await testConnection();
    expect(res.success).toBe(true);
  });

  it('retorna erro claro quando 401', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Unauthorized' } }) })) as any;
    const res = await testConnection();
    expect(res.success).toBe(false);
    expect(res.message).toContain('Falha');
  });
});
