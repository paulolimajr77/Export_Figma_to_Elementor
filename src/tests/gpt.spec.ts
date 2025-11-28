import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openaiProvider } from '../api_openai';

describe('OpenAI provider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (globalThis as any).figma = {
      clientStorage: {
        getAsync: async (key: string) => (key === 'gpt_api_key' ? 'test-key' : undefined),
        setAsync: async () => {}
      }
    } as any;
  });

  it('testConnection retorna sucesso com JSON valido', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"pong":true}' } }] })
    })) as any;

    const res = await openaiProvider.testConnection('dummy');
    expect(res.ok).toBe(true);
  });

  it('generateSchema retorna schema JSON quando API responde corretamente', async () => {
    const schema = {
      page: { title: 'Teste', tokens: { primaryColor: '#000', secondaryColor: '#fff' } },
      containers: []
    };

    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(schema) } }] })
    })) as any;

    const res = await openaiProvider.generateSchema({
      prompt: 'prompt completo',
      snapshot: { id: '1', name: 'Frame' },
      instructions: 'instrucao flex',
      apiKey: 'key'
    });

    expect(res.ok).toBe(true);
    expect(res.schema?.page?.title).toBe('Teste');
  });
});
