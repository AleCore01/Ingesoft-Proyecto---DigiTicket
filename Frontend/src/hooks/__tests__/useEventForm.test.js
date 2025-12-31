import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEventForm } from '../useEventForm';

describe('useEventForm', () => {
  const mockService = {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const defaults = {
    title: "",
    description: "",
    status: "DRAFT",
    date: "",
    durationMin: "",
    startsAt: "",
    endTime: "",
    eventCategoryId: "",
    locationId: "",
    salesStartAt: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debería inicializar en modo create', () => {
    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    expect(result.current.mode).toBe('create');
    expect(result.current.isEdit).toBe(false);
  });

  it('debería inicializar en modo edit cuando hay id', () => {
    const { result } = renderHook(() => 
      useEventForm({ id: 1, service: mockService, defaults })
    );

    expect(result.current.mode).toBe('edit');
    expect(result.current.isEdit).toBe(true);
  });

  it('debería cargar evento en modo edit', async () => {
    const mockEvent = {
      id: 1,
      title: 'Concierto de Rock',
      description: 'Gran evento',
      status: 'ACTIVE',
      startsAt: '2025-06-15T20:00:00',
      durationMin: 120,
      eventCategoryId: 2,
      locationId: 5,
      salesStartAt: '2025-06-01T00:00:00',
    };
    mockService.getById.mockResolvedValue({ data: mockEvent });

    const { result } = renderHook(() => 
      useEventForm({ id: 1, service: mockService, defaults })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.form.title).toBe('Concierto de Rock');
    expect(result.current.form.date).toBe('2025-06-15');
    expect(result.current.form.startsAt).toBe('20:00');
  });

  it('setField debería actualizar campo específico', () => {
    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setField('title')('Mi Evento');
    });

    expect(result.current.form.title).toBe('Mi Evento');
  });

  it('debería validar campos requeridos', () => {
    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    expect(result.current.errors.title).toBe('*Campo requerido');
    expect(result.current.errors.eventCategoryId).toBe('*Seleccione una categoria');
    expect(result.current.errors.locationId).toBe('*Seleccione un local');
    expect(result.current.errors.date).toBe('*Campo requerido');
    expect(result.current.errors.startsAt).toBe('*Campo requerido');
  });

  it('debería validar que salesStartAt sea antes del evento', () => {
    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setForm({
        ...defaults,
        date: '2025-06-15',
        salesStartAt: '2025-06-20', // después del evento
      });
    });

    expect(result.current.errors.salesStartAt).toBe('La venta debe iniciar antes del día del evento.');
  });

  it('submit debería fallar con errores de validación', async () => {
    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult.ok).toBe(false);
    expect(submitResult.reason).toBe('validation');
    expect(mockService.create).not.toHaveBeenCalled();
  });

  it('submit debería crear evento con datos válidos', async () => {
    const mockCreated = { id: 1, title: 'Nuevo Evento' };
    mockService.create.mockResolvedValue({ data: mockCreated });

    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setForm({
        title: 'Nuevo Evento',
        description: 'Descripción del evento',
        status: 'DRAFT',
        date: '2025-06-15',
        startsAt: '20:00',
        endTime: '22:00',
        eventCategoryId: 2,
        locationId: 5,
        salesStartAt: '2025-06-01',
      });
    });

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult.ok).toBe(true);
    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nuevo Evento',
        startsAt: '2025-06-15T20:00:00',
        durationMin: 120, // 20:00 a 22:00 = 120 min
        administratorId: 1,
      })
    );
  });

  it('submit debería actualizar evento en modo edit', async () => {
    const mockEvent = {
      title: 'Evento Original',
      description: 'Desc',
      status: 'DRAFT',
      startsAt: '2025-06-15T20:00:00',
      durationMin: 120,
      eventCategoryId: 2,
      locationId: 5,
      salesStartAt: '2025-06-01T00:00:00',
    };
    mockService.getById.mockResolvedValue({ data: mockEvent });
    mockService.update.mockResolvedValue({ id: 1, title: 'Evento Actualizado' });

    const { result } = renderHook(() => 
      useEventForm({ id: 1, service: mockService, defaults })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setField('title')('Evento Actualizado');
    });

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult.ok).toBe(true);
    expect(mockService.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        title: 'Evento Actualizado',
      })
    );
  });

  it('debería calcular durationMin correctamente', async () => {
    mockService.create.mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setForm({
        title: 'Evento',
        description: 'Desc',
        status: 'DRAFT',
        date: '2025-06-15',
        startsAt: '14:30',
        endTime: '17:00',
        eventCategoryId: 2,
        locationId: 5,
        salesStartAt: '2025-06-01',
      });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMin: 150, // 14:30 a 17:00 = 150 min
      })
    );
  });

  it('debería manejar cruce de medianoche en durationMin', async () => {
    mockService.create.mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setForm({
        title: 'Evento',
        description: 'Desc',
        status: 'DRAFT',
        date: '2025-06-15',
        startsAt: '23:00',
        endTime: '01:00',
        eventCategoryId: 2,
        locationId: 5,
        salesStartAt: '2025-06-01',
      });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMin: 120, // 23:00 a 01:00 = 120 min (cruce medianoche)
      })
    );
  });

  it('debería incluir imageBase64 si existe', async () => {
    mockService.create.mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setForm({
        title: 'Evento',
        description: 'Desc',
        status: 'DRAFT',
        date: '2025-06-15',
        startsAt: '20:00',
        endTime: '22:00',
        eventCategoryId: 2,
        locationId: 5,
        salesStartAt: '2025-06-01',
        imageBase64: 'data:image/png;base64,abc123',
      });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        imageBase64: 'data:image/png;base64,abc123',
      })
    );
  });

  it('debería llamar onLoaded cuando carga evento', async () => {
    const onLoaded = vi.fn();
    const mockEvent = {
      title: 'Evento Test',
      startsAt: '2025-06-15T20:00:00',
      durationMin: 120,
    };
    mockService.getById.mockResolvedValue({ data: mockEvent });

    renderHook(() => 
      useEventForm({ 
        id: 1, 
        service: mockService, 
        defaults,
        onLoaded 
      })
    );

    await waitFor(() => {
      expect(onLoaded).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Evento Test' })
      );
    });
  });

  it('debería llamar onSaved después de guardar', async () => {
    const onSaved = vi.fn();
    mockService.create.mockResolvedValue({ data: { id: 1 } });

    const { result } = renderHook(() => 
      useEventForm({ 
        service: mockService, 
        defaults,
        onSaved 
      })
    );

    act(() => {
      result.current.setForm({
        title: 'Evento',
        description: 'Desc',
        status: 'DRAFT',
        date: '2025-06-15',
        startsAt: '20:00',
        endTime: '22:00',
        eventCategoryId: 2,
        locationId: 5,
        salesStartAt: '2025-06-01',
      });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(onSaved).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ mode: 'create' })
    );
  });

  it('debería manejar errores de servidor', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockService.create.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setForm({
        title: 'Evento',
        description: 'Desc',
        status: 'DRAFT',
        date: '2025-06-15',
        startsAt: '20:00',
        endTime: '22:00',
        eventCategoryId: 2,
        locationId: 5,
        salesStartAt: '2025-06-01',
      });
    });

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult.ok).toBe(false);
    expect(submitResult.reason).toBe('server');
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('debería permitir transformPayload personalizado', async () => {
    mockService.create.mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => 
      useEventForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setForm({
        title: 'Evento',
        description: 'Desc',
        status: 'DRAFT',
        date: '2025-06-15',
        startsAt: '20:00',
        endTime: '22:00',
        eventCategoryId: 2,
        locationId: 5,
        salesStartAt: '2025-06-01',
      });
    });

    const transformPayload = (data) => ({
      ...data,
      customField: 'custom value',
    });

    await act(async () => {
      await result.current.submit(transformPayload);
    });

    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customField: 'custom value',
      })
    );
  });

  it('debería usar initialEvent si se proporciona', async () => {
    const mockEvent = {
      title: 'Evento Inicial',
      startsAt: '2025-06-15T20:00:00',
      durationMin: 120,
    };

    const { result } = renderHook(() => 
      useEventForm({ 
        id: 1, 
        service: mockService, 
        defaults,
        initialEvent: mockEvent 
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.form.title).toBe('Evento Inicial');
    expect(mockService.getById).not.toHaveBeenCalled();
  });

  it('debería calcular endTime desde durationMin al cargar', async () => {
    const mockEvent = {
      title: 'Evento',
      startsAt: '2025-06-15T14:00:00',
      durationMin: 90,
    };
    mockService.getById.mockResolvedValue({ data: mockEvent });

    const { result } = renderHook(() => 
      useEventForm({ id: 1, service: mockService, defaults })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.form.endTime).toBe('15:30'); // 14:00 + 90min = 15:30
  });
});
