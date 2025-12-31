import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLocalForm } from '../useLocalForm';

describe('useLocalForm', () => {
  const mockService = {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const defaults = {
    name: "",
    address: "",
    city: "",
    district: "",
    capacity: "",
    status: "",
    contactEmail: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería inicializar en modo create', () => {
    const { result } = renderHook(() => 
      useLocalForm({ service: mockService, defaults })
    );

    expect(result.current.mode).toBe('create');
    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.name).toBe('');
  });

  it('debería inicializar en modo edit cuando hay id', () => {
    const { result } = renderHook(() => 
      useLocalForm({ id: 1, service: mockService, defaults })
    );

    expect(result.current.mode).toBe('edit');
    expect(result.current.isEdit).toBe(true);
  });

  it('debería cargar local en modo edit', async () => {
    const mockLocal = {
      id: 1,
      name: 'Estadio Nacional',
      address: 'Av. José Díaz',
      city: 'Lima',
      district: 'Cercado',
      capacity: 50000,
      status: 'ACTIVE',
      contactEmail: 'info@estadio.com',
    };
    mockService.getById.mockResolvedValue({ data: mockLocal });

    const { result } = renderHook(() => 
      useLocalForm({ id: 1, service: mockService, defaults })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.formData.name).toBe('Estadio Nacional');
    expect(mockService.getById).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('debería usar initialLocal si se proporciona', async () => {
    const mockLocal = {
      name: 'Teatro',
      address: 'Jr. Ica',
      city: 'Lima',
      district: 'Centro',
      capacity: 1000,
      status: 'ACTIVE',
    };

    const { result } = renderHook(() => 
      useLocalForm({ 
        id: 1, 
        service: mockService, 
        defaults,
        initialLocal: mockLocal 
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.formData.name).toBe('Teatro');
    expect(mockService.getById).not.toHaveBeenCalled();
  });

  it('setField debería actualizar campo específico', () => {
    const { result } = renderHook(() => 
      useLocalForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setField('name')('Mi Local');
    });

    expect(result.current.formData.name).toBe('Mi Local');
  });

  it('setFieldTouched debería marcar campo como tocado', () => {
    const { result } = renderHook(() => 
      useLocalForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setFieldTouched('name', true);
    });

    expect(result.current.touched.name).toBe(true);
  });

  it('debería validar campos requeridos', () => {
    const { result } = renderHook(() => 
      useLocalForm({ service: mockService, defaults })
    );

    expect(result.current.errors.name).toBe('*Campo requerido');
    expect(result.current.errors.address).toBe('*Campo requerido');
    expect(result.current.errors.city).toBe('*Seleccione una ciudad');
    expect(result.current.errors.district).toBe('*Seleccione un distrito');
    expect(result.current.errors.capacity).toBe('*Campo requerido');
  });

  it('debería validar email si se proporciona', () => {
    const { result } = renderHook(() => 
      useLocalForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setField('contactEmail')('invalid-email');
    });

    expect(result.current.errors.contactEmail).toBe('Correo inválido');
  });

  it('debería pasar validación con email correcto', () => {
    const { result } = renderHook(() => 
      useLocalForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setFormData({
        name: 'Local',
        address: 'Dirección',
        city: 'Lima',
        district: 'Miraflores',
        capacity: 100,
        status: 'ACTIVE',
        contactEmail: 'info@local.com',
      });
    });

    expect(result.current.errors.contactEmail).toBeUndefined();
  });

  it('submit debería fallar con errores de validación', async () => {
    const { result } = renderHook(() => 
      useLocalForm({ service: mockService, defaults })
    );

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult.ok).toBe(false);
    expect(submitResult.reason).toBe('validation');
    expect(mockService.create).not.toHaveBeenCalled();
  });

  it('submit debería crear local con datos válidos', async () => {
    const mockCreated = { id: 1, name: 'Nuevo Local' };
    mockService.create.mockResolvedValue(mockCreated);

    const { result } = renderHook(() => 
      useLocalForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setFormData({
        name: 'Nuevo Local',
        address: 'Av. Principal',
        city: 'Lima',
        district: 'San Isidro',
        capacity: 500,
        contactEmail: '',
      });
    });

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult.ok).toBe(true);
    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Nuevo Local',
        status: 'ACTIVE', // forzado en create
      })
    );
  });

  it('submit debería actualizar local en modo edit', async () => {
    const mockLocal = {
      name: 'Local Original',
      address: 'Dirección',
      city: 'Lima',
      district: 'Centro',
      capacity: 1000,
      status: 'ACTIVE',
    };
    mockService.getById.mockResolvedValue({ data: mockLocal });
    mockService.update.mockResolvedValue({ id: 1, name: 'Local Actualizado' });

    const { result } = renderHook(() => 
      useLocalForm({ id: 1, service: mockService, defaults })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setField('name')('Local Actualizado');
    });

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(submitResult.ok).toBe(true);
    expect(mockService.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        name: 'Local Actualizado',
      })
    );
  });

  it('debería llamar onLoaded cuando carga datos', async () => {
    const onLoaded = vi.fn();
    const mockLocal = {
      name: 'Local Test',
      address: 'Test',
      city: 'Lima',
      district: 'Centro',
      capacity: 100,
      status: 'ACTIVE',
    };
    mockService.getById.mockResolvedValue({ data: mockLocal });

    renderHook(() => 
      useLocalForm({ 
        id: 1, 
        service: mockService, 
        defaults,
        onLoaded 
      })
    );

    await waitFor(() => {
      expect(onLoaded).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Local Test' })
      );
    });
  });

  it('debería llamar onSaved después de guardar', async () => {
    const onSaved = vi.fn();
    mockService.create.mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => 
      useLocalForm({ 
        service: mockService, 
        defaults,
        onSaved 
      })
    );

    act(() => {
      result.current.setFormData({
        name: 'Local',
        address: 'Dir',
        city: 'Lima',
        district: 'Centro',
        capacity: 100,
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
      useLocalForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setFormData({
        name: 'Local',
        address: 'Dir',
        city: 'Lima',
        district: 'Centro',
        capacity: 100,
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
      useLocalForm({ service: mockService, defaults })
    );

    act(() => {
      result.current.setFormData({
        name: 'Local',
        address: 'Dir',
        city: 'Lima',
        district: 'Centro',
        capacity: 100,
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

  it('debería validar status en modo edit', () => {
    const mockLocal = {
      name: 'Local',
      address: 'Dir',
      city: 'Lima',
      district: 'Centro',
      capacity: 100,
      status: '', // status vacío
    };

    const { result } = renderHook(() => 
      useLocalForm({ 
        id: 1, 
        service: mockService, 
        defaults,
        initialLocal: mockLocal 
      })
    );

    expect(result.current.errors.status).toBe('*Campo requerido');
  });
});
