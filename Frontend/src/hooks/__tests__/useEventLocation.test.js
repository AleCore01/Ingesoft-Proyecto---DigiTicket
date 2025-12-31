import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEventLocation } from '../useEventLocation';
import { localService } from '../../services/localService';

vi.mock('../../services/localService');

describe('useEventLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLocales = [
    {
      id: 1,
      name: 'Estadio Nacional',
      address: 'Av. José Díaz',
      district: 'Cercado de Lima',
      city: 'Lima',
      capacity: 50000,
      status: 'ACTIVE',
    },
    {
      id: 2,
      name: 'Teatro Municipal',
      address: 'Jr. Ica 300',
      district: 'Cercado de Lima',
      city: 'Lima',
      capacity: 1000,
      status: 'ACTIVE',
    },
  ];

  it('debería cargar locales al montar', async () => {
    localService.getAll.mockResolvedValue({ data: mockLocales });

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(localService.getAll).toHaveBeenCalled();
  });

  it('getLocationName debería retornar nombre del local', async () => {
    localService.getAll.mockResolvedValue({ data: mockLocales });

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getLocationName({ locationId: 1 })).toBe('Estadio Nacional');
  });

  it('getLocationName debería retornar — si no encuentra local', async () => {
    localService.getAll.mockResolvedValue({ data: mockLocales });

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getLocationName({ locationId: 999 })).toBe('—');
  });

  it('getLocationAddress debería formatear dirección completa', async () => {
    localService.getAll.mockResolvedValue({ data: mockLocales });

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const address = result.current.getLocationAddress({ locationId: 1 });
    expect(address).toContain('Av. José Díaz');
    expect(address).toContain('Cercado de Lima');
    expect(address).toContain('Lima');
  });

  it('getLocationAddress debería retornar — si no encuentra', async () => {
    localService.getAll.mockResolvedValue({ data: mockLocales });

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getLocationAddress({ locationId: 999 })).toBe('—');
  });

  it('locationsById debería contener todos los locales por ID', async () => {
    localService.getAll.mockResolvedValue({ data: mockLocales });

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.locationsById[1]).toBeDefined();
    expect(result.current.locationsById[1].name).toBe('Estadio Nacional');
    expect(result.current.locationsById[1].capacity).toBe(50000);
  });

  it('activeLocations debería retornar solo locales activos', async () => {
    localService.getAll.mockResolvedValue({ data: mockLocales });

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activeLocations).toHaveLength(2);
    expect(result.current.activeLocations[0].status).toBe('ACTIVE');
  });

  it('debería manejar respuesta con content anidado', async () => {
    localService.getAll.mockResolvedValue({ data: { content: mockLocales } });

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getLocationName({ locationId: 1 })).toBe('Estadio Nacional');
  });

  it('debería manejar locales sin dirección completa', async () => {
    const incompleteLocales = [
      { id: 1, name: 'Estadio' },
      { id: 2, name: 'Teatro', address: 'Jr. Ica', city: 'Lima' },
    ];
    localService.getAll.mockResolvedValue({ data: incompleteLocales });

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getLocationAddress({ locationId: 1 })).toBe('—');
    expect(result.current.getLocationAddress({ locationId: 2 })).toContain('Jr. Ica');
  });

  it('debería manejar errores', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localService.getAll.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    
    consoleErrorSpy.mockRestore();
  });

  it('solo debería cargar una vez', async () => {
    localService.getAll.mockResolvedValue({ data: mockLocales });

    const { rerender } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(localService.getAll).toHaveBeenCalledTimes(1);
    });

    rerender();
    
    expect(localService.getAll).toHaveBeenCalledTimes(1);
  });

  it('debería permitir reload manual', async () => {
    localService.getAll.mockResolvedValue({ data: mockLocales });

    const { result } = renderHook(() => useEventLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Llamar reload
    await act(async () => {
      result.current.reload();
    });
    
    await waitFor(() => {
      expect(localService.getAll).toHaveBeenCalledTimes(2);
    });
  });
});
