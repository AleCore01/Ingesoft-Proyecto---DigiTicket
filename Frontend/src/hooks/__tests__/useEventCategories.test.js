import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEventCategories } from '../useEventCategories';
import { eventCategoryService } from '../../services/eventCategoryService';

vi.mock('../../services/eventCategoryService');

describe('useEventCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategories = [
    { id: 1, name: 'Música' },
    { id: 2, name: 'Teatro' },
    { id: 3, name: 'Deportes' },
  ];

  it('debería cargar categorías al montar', async () => {
    eventCategoryService.getAll.mockResolvedValue({ data: mockCategories });

    const { result } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.categories).toHaveLength(3);
  });

  it('debería crear mapa de categorías por ID', async () => {
    eventCategoryService.getAll.mockResolvedValue({ data: mockCategories });

    const { result } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(result.current.categoriesById['1']).toBe('Música');
      expect(result.current.categoriesById['2']).toBe('Teatro');
    });
  });

  it('debería generar selectOptions', async () => {
    eventCategoryService.getAll.mockResolvedValue({ data: mockCategories });

    const { result } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(result.current.selectOptions).toHaveLength(3);
      expect(result.current.selectOptions[0]).toEqual({ value: 1, label: 'Música' });
    });
  });

  it('getCategoryName debería obtener nombre de eventCategory', async () => {
    eventCategoryService.getAll.mockResolvedValue({ data: mockCategories });

    const { result } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const event = { eventCategory: { name: 'Concierto' } };
    expect(result.current.getCategoryName(event)).toBe('Concierto');
  });

  it('getCategoryName debería buscar por eventCategoryId', async () => {
    eventCategoryService.getAll.mockResolvedValue({ data: mockCategories });

    const { result } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const event = { eventCategoryId: 1 };
    expect(result.current.getCategoryName(event)).toBe('Música');
  });

  it('getCategoryName debería retornar mensaje por defecto si no encuentra', async () => {
    eventCategoryService.getAll.mockResolvedValue({ data: mockCategories });

    const { result } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const event = { categoryId: 999 };
    expect(result.current.getCategoryName(event)).toBe('Categoría no encontrada');
  });

  it('getCategoryName debería retornar — si evento es null', async () => {
    eventCategoryService.getAll.mockResolvedValue({ data: mockCategories });

    const { result } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getCategoryName(null)).toBe('—');
  });

  it('debería manejar diferentes formatos de respuesta', async () => {
    eventCategoryService.getAll.mockResolvedValue({ data: { content: mockCategories } });

    const { result } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(3);
    });
  });

  it('debería manejar errores', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    eventCategoryService.getAll.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('debería normalizar categorías con nombre faltante', async () => {
    const incompleteCategories = [
      { id: 1, name: 'Música' },
      { id: 2 }, // Sin nombre
    ];
    eventCategoryService.getAll.mockResolvedValue({ data: incompleteCategories });

    const { result } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(2);
      expect(result.current.categories[1].name).toContain('Categoría 2');
    });
  });

  it('solo debería llamar getAll una vez', async () => {
    eventCategoryService.getAll.mockResolvedValue({ data: mockCategories });

    const { rerender } = renderHook(() => useEventCategories());

    await waitFor(() => {
      expect(eventCategoryService.getAll).toHaveBeenCalledTimes(1);
    });

    // Rerender no debería llamar nuevamente
    rerender();
    
    expect(eventCategoryService.getAll).toHaveBeenCalledTimes(1);
  });
});
