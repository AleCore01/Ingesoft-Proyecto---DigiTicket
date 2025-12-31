import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebouncedSearch } from '../useDebouncedSearch';

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería ejecutar búsqueda después del delay', async () => {
    const mockSearchService = vi.fn().mockResolvedValue({ data: ['result1', 'result2'] });
    const mockOnResult = vi.fn();
    const mockSetLoading = vi.fn();

      const { rerender } = renderHook(
      ({ searchTerm }) =>
        useDebouncedSearch({
          searchTerm,
          setLoading: mockSetLoading,
          onResult: mockOnResult,
          searchService: mockSearchService,
          dependencies: [],
          delay: 100,
        }),
      { initialProps: { searchTerm: 'test' } }
    );    // Esperar el delay + procesamiento
    await waitFor(() => {
      expect(mockSearchService).toHaveBeenCalledWith('test', expect.any(Object));
    }, { timeout: 500 });

    expect(mockOnResult).toHaveBeenCalledWith(['result1', 'result2']);
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('debería cancelar búsqueda anterior si searchTerm cambia', async () => {
    const mockSearchService = vi.fn().mockResolvedValue({ data: ['result'] });
    const mockOnResult = vi.fn();
    const mockSetLoading = vi.fn();

    const { rerender } = renderHook(
      ({ searchTerm }) =>
        useDebouncedSearch({
          searchTerm,
          setLoading: mockSetLoading,
          onResult: mockOnResult,
          searchService: mockSearchService,
          dependencies: [],
          delay: 100,
        }),
      { initialProps: { searchTerm: 'first' } }
    );

    // Cambiar searchTerm antes del delay
    rerender({ searchTerm: 'second' });

    await waitFor(() => {
      expect(mockSearchService).toHaveBeenCalled();
    }, { timeout: 500 });

    // Solo debe ejecutar la última búsqueda
    expect(mockSearchService).toHaveBeenCalledTimes(1);
    expect(mockSearchService).toHaveBeenCalledWith('second', expect.any(Object));
  });

  it('debería llamar onEmpty si searchTerm está vacío', async () => {
    const mockOnEmpty = vi.fn();
    const mockSetLoading = vi.fn();
    const mockSearchService = vi.fn();

    renderHook(() =>
      useDebouncedSearch({
        searchTerm: '',
        setLoading: mockSetLoading,
        onEmpty: mockOnEmpty,
        searchService: mockSearchService,
        dependencies: [],
        delay: 50,
      })
    );

    await waitFor(() => {
      expect(mockOnEmpty).toHaveBeenCalled();
    }, { timeout: 300 });

    expect(mockSearchService).not.toHaveBeenCalled();
  });

  it('debería usar buildParams si está provisto', async () => {
    const mockSearchService = vi.fn().mockResolvedValue({ data: [] });
    const mockBuildParams = vi.fn((term) => ({ query: term, filter: 'active' }));
    const mockSetLoading = vi.fn();
    const mockOnResult = vi.fn();

    renderHook(() =>
      useDebouncedSearch({
        searchTerm: 'test',
        setLoading: mockSetLoading,
        onResult: mockOnResult,
        searchService: mockSearchService,
        buildParams: mockBuildParams,
        dependencies: [],
        delay: 50,
      })
    );

    await waitFor(() => {
      expect(mockSearchService).toHaveBeenCalled();
    }, { timeout: 300 });

    expect(mockBuildParams).toHaveBeenCalledWith('test');
    expect(mockSearchService).toHaveBeenCalledWith(
      { query: 'test', filter: 'active' },
      expect.any(Object)
    );
  });

  it('debería manejar errores sin crash', async () => {
    const mockSearchService = vi.fn().mockRejectedValue(new Error('Search failed'));
    const mockSetLoading = vi.fn();
    const mockOnResult = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() =>
      useDebouncedSearch({
        searchTerm: 'test',
        setLoading: mockSetLoading,
        onResult: mockOnResult,
        searchService: mockSearchService,
        dependencies: [],
        delay: 50,
      })
    );

    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    }, { timeout: 300 });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error en búsqueda:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('debería usar unwrap personalizado', async () => {
    const mockSearchService = vi.fn().mockResolvedValue({ results: { items: ['a', 'b'] } });
    const mockOnResult = vi.fn();
    const mockSetLoading = vi.fn();
    const customUnwrap = (res) => res?.results?.items ?? [];

    renderHook(() =>
      useDebouncedSearch({
        searchTerm: 'test',
        setLoading: mockSetLoading,
        onResult: mockOnResult,
        searchService: mockSearchService,
        unwrap: customUnwrap,
        dependencies: [],
        delay: 50,
      })
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(['a', 'b']);
    }, { timeout: 300 });
  });

  it('debería ejecutar búsqueda vacía si runWhenEmpty es true', async () => {
    const mockSearchService = vi.fn().mockResolvedValue({ data: [] });
    const mockOnResult = vi.fn();
    const mockSetLoading = vi.fn();

    renderHook(() =>
      useDebouncedSearch({
        searchTerm: '',
        setLoading: mockSetLoading,
        onResult: mockOnResult,
        searchService: mockSearchService,
        runWhenEmpty: () => true,
        dependencies: [],
        delay: 50,
      })
    );

    await waitFor(() => {
      expect(mockSearchService).toHaveBeenCalled();
    }, { timeout: 300 });

    expect(mockSearchService).toHaveBeenCalledWith('', expect.any(Object));
  });
});
