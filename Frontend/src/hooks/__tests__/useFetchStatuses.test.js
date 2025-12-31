import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFetchStatuses } from '../useFetchStatuses';

describe('useFetchStatuses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería inicializar con estado vacío', () => {
    const { result } = renderHook(() => useFetchStatuses(() => {}));
    
    expect(result.current.statuses).toEqual([]);
  });

  it('debería cargar statuses desde fetchFn', async () => {
    const mockFetchFn = vi.fn().mockResolvedValue({
      data: ['ACTIVE', 'INACTIVE', 'PENDING'],
    });

    const { result } = renderHook(() => useFetchStatuses(mockFetchFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statuses).toHaveLength(3);
    expect(result.current.statuses[0]).toEqual({ id: 'ACTIVE', name: 'ACTIVE' });
  });

  it('debería normalizar statuses como objetos', async () => {
    const mockFetchFn = vi.fn().mockResolvedValue({
      data: [
        { id: '1', name: 'Activo' },
        { id: '2', name: 'Inactivo' },
      ],
    });

    const { result } = renderHook(() => useFetchStatuses(mockFetchFn));

    await waitFor(() => {
      expect(result.current.statuses).toHaveLength(2);
    });

    expect(result.current.statuses[0]).toEqual({ id: '1', name: 'Activo' });
  });

  it('debería manejar respuesta directa como array', async () => {
    const mockFetchFn = vi.fn().mockResolvedValue(['STATUS_A', 'STATUS_B']);

    const { result } = renderHook(() => useFetchStatuses(mockFetchFn));

    await waitFor(() => {
      expect(result.current.statuses).toHaveLength(2);
    });
  });

  it('debería setear loading a true durante fetch', async () => {
    const mockFetchFn = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
    );

    const { result } = renderHook(() => useFetchStatuses(mockFetchFn));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('debería manejar errores sin crash', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockFetchFn = vi.fn().mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useFetchStatuses(mockFetchFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statuses).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    consoleWarnSpy.mockRestore();
  });

  it('no debería llamar fetchFn si no es una función', async () => {
    const { result } = renderHook(() => useFetchStatuses(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statuses).toEqual([]);
  });

  it('debería limpiar en unmount', () => {
    const mockFetchFn = vi.fn().mockResolvedValue({ data: ['TEST'] });

    const { unmount } = renderHook(() => useFetchStatuses(mockFetchFn));

    unmount();

    // No debe haber errores al desmontar
    expect(mockFetchFn).toHaveBeenCalled();
  });

  it('debería ignorar respuesta si el componente se desmonta', async () => {
    let resolvePromise;
    const mockFetchFn = vi.fn().mockReturnValue(
      new Promise(resolve => {
        resolvePromise = resolve;
      })
    );

    const { result, unmount } = renderHook(() => useFetchStatuses(mockFetchFn));

    // Desmontar antes de que resuelva
    unmount();

    // Resolver después de desmontar
    resolvePromise({ data: ['LATE_STATUS'] });

    await waitFor(() => {
      expect(result.current.statuses).toEqual([]);
    });
  });
});
