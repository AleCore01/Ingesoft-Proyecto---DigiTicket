import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageSlice } from '../usePageSlice';

describe('usePageSlice', () => {
  it('debería inicializar con página 1', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    
    const { result } = renderHook(() => usePageSlice(items, 5));

    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toHaveLength(5);
    expect(result.current.pageItems[0].id).toBe(0);
  });

  it('debería calcular totalPages correctamente', () => {
    const items = Array.from({ length: 23 }, (_, i) => ({ id: i }));
    
    const { result } = renderHook(() => usePageSlice(items, 10));

    expect(result.current.totalPages).toBe(3); // 23 items / 10 per page = 3 pages
  });

  it('debería devolver slice correcto para cada página', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
    
    const { result } = renderHook(() => usePageSlice(items, 10));

    // Página 1
    expect(result.current.pageItems).toHaveLength(10);
    expect(result.current.pageItems[0].id).toBe(0);
    expect(result.current.pageItems[9].id).toBe(9);

    // Cambiar a página 2
    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.pageItems).toHaveLength(10);
    expect(result.current.pageItems[0].id).toBe(10);
    expect(result.current.pageItems[9].id).toBe(19);

    // Cambiar a página 3 (última)
    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.pageItems).toHaveLength(5);
    expect(result.current.pageItems[0].id).toBe(20);
    expect(result.current.pageItems[4].id).toBe(24);
  });

  it('debería resetear a página 1 cuando items cambian', () => {
    const initialItems = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    
    const { result, rerender } = renderHook(
      ({ items }) => usePageSlice(items, 5),
      { initialProps: { items: initialItems } }
    );

    // Cambiar a página 2
    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.page).toBe(2);

    // Cambiar items
    const newItems = Array.from({ length: 15 }, (_, i) => ({ id: i + 100 }));
    rerender({ items: newItems });

    expect(result.current.page).toBe(1);
  });

  it('debería manejar array vacío', () => {
    const { result } = renderHook(() => usePageSlice([], 10));

    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.pageItems).toEqual([]);
  });

  it('debería manejar null/undefined como items', () => {
    const { result } = renderHook(() => usePageSlice(null, 10));

    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.pageItems).toEqual([]);
  });

  it('debería usar pageSize default de 8', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    
    const { result } = renderHook(() => usePageSlice(items));

    expect(result.current.pageItems).toHaveLength(8);
    expect(result.current.totalPages).toBe(3); // 20 / 8 = 3 páginas
  });

  it('debería manejar un solo item', () => {
    const items = [{ id: 1 }];
    
    const { result } = renderHook(() => usePageSlice(items, 10));

    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.pageItems).toHaveLength(1);
  });

  it('debería manejar exactamente pageSize items', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    
    const { result } = renderHook(() => usePageSlice(items, 10));

    expect(result.current.totalPages).toBe(1);
    expect(result.current.pageItems).toHaveLength(10);
  });
});
