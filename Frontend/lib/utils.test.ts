import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cn, loginRequest } from './utils';

// Mock fetch para loginRequest
beforeEach(() => {
  vi.restoreAllMocks();
});

describe('cn utility', () => {
  it('combina clases simples', () => {
    expect(cn('a', 'b', 'c')).toMatch(/a/);
    expect(cn('a', 'b', 'c')).toMatch(/b/);
    expect(cn('a', 'b', 'c')).toMatch(/c/);
  });

  it('elimina duplicados y merge tailwind', () => {
    const result = cn('p-2', 'p-4', 'text-sm', false && 'hidden');
    // tailwind-merge debería dejar p-4 (última)
    expect(result).toContain('p-4');
    expect(result).not.toContain('p-2');
    expect(result).toContain('text-sm');
  });

  it('ignora valores falsy', () => {
    const result = cn('base', null, undefined, '', false, 'final');
    expect(result).toContain('base');
    expect(result).toContain('final');
    expect(result.split(' ').length).toBe(2);
  });
});

describe('loginRequest', () => {
  it('realiza POST a /api/auth/login con headers correctos', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: 'abc123' })
    });
    // @ts-ignore
    global.fetch = mockFetch;
    const data = await loginRequest('user@example.com', 'secret');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ email: 'user@example.com', password: 'secret' });
    expect(data).toEqual({ token: 'abc123' });
  });

  it('rejecta en error de credenciales', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Credenciales inválidas' })
    });
    // @ts-ignore
    global.fetch = mockFetch;
    await expect(loginRequest('bad@example.com', 'wrong')).rejects.toEqual({ message: 'Credenciales inválidas' });
  });

  it('rejecta en error de red', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network down'));
    // @ts-ignore
    global.fetch = mockFetch;
    await expect(loginRequest('net@example.com', 'pw')).rejects.toEqual({ message: 'Error de red' });
  });

  it('parsea correctamente body de éxito', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ user: { id: 1 } })
    });
    // @ts-ignore
    global.fetch = mockFetch;
    const data = await loginRequest('user@example.com', 'pw');
    expect(data.user.id).toBe(1);
  });

  it('parsea correctamente body de error distinto de 2xx', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Internal' })
    });
    // @ts-ignore
    global.fetch = mockFetch;
    await expect(loginRequest('user@example.com', 'pw')).rejects.toEqual({ message: 'Internal' });
  });
});
