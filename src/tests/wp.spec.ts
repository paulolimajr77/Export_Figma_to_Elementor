import { describe, it, expect } from 'vitest';

function normalizeWpUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url.replace(/\/+$/, '');
}

describe('WP helpers', () => {
  it('normaliza URL sem protocolo', () => {
    expect(normalizeWpUrl('meusite.com')).toBe('https://meusite.com');
  });
  it('remove barras extras', () => {
    expect(normalizeWpUrl('https://meusite.com///')).toBe('https://meusite.com');
  });
  it('retorna vazio para input vazio', () => {
    expect(normalizeWpUrl('')).toBe('');
  });
});
