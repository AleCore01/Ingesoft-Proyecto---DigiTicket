import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEventZones } from '../useEventZones';
import { eventZoneService } from '../../services/eventZoneService';
import { useEventLocation } from '../useEventLocation';

vi.mock('../../services/eventZoneService');
vi.mock('../useEventLocation');

describe('useEventZones', () => {
  const mockGetLocationCapacity = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useEventLocation.mockReturnValue({
      getLocationCapacity: mockGetLocationCapacity,
    });
    mockGetLocationCapacity.mockReturnValue(1000);
  });

  const mockEvent = {
    id: 1,
    locationId: 10,
  };

  const mockZones = [
    {
      id: 1,
      displayName: 'VIP',
      price: 100,
      seatsQuota: 200,
      seatsSold: 50,
      seatsAvailable: 150,
      status: 'ACTIVE',
      locationZoneId: 1,
    },
    {
      id: 2,
      displayName: 'General',
      price: 50,
      seatsQuota: 800,
      seatsSold: 400,
      seatsAvailable: 400,
      status: 'ACTIVE',
      locationZoneId: 2,
    },
  ];

  it('debería cargar zonas del evento', async () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: mockZones });

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.zones).toHaveLength(2);
    expect(result.current.zones[0].displayName).toBe('VIP');
  });

  it('debería calcular totals correctamente', async () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: mockZones });

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totals.totalSold).toBe(450);
    expect(result.current.totals.totalQuota).toBe(1000);
  });

  it('debería detectar cuando capacidad es excedida', async () => {
    const oversizedZones = [
      { id: 1, displayName: 'VIP', seatsQuota: 600, seatsSold: 0, price: 100 },
      { id: 2, displayName: 'General', seatsQuota: 600, seatsSold: 0, price: 50 },
    ];
    eventZoneService.listByEvent.mockResolvedValue({ data: oversizedZones });
    mockGetLocationCapacity.mockReturnValue(1000);

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isCapacityExceeded).toBe(true);
    expect(result.current.totalCapacityZones).toBe(1200);
  });

  it('toggleEditZone debería cambiar estado editing', async () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: mockZones });

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.toggleEditZone(1);
    });

    expect(result.current.zones[0].editing).toBe(true);

    act(() => {
      result.current.toggleEditZone(1);
    });

    expect(result.current.zones[0].editing).toBe(false);
  });

  it('updateZoneField debería actualizar campo específico', async () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: mockZones });

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateZoneField(1, 'displayName', 'Super VIP');
    });

    expect(result.current.zones[0].displayName).toBe('Super VIP');
  });

  it('updateZoneField debería convertir price a número', async () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: mockZones });

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateZoneField(1, 'price', '150');
    });

    expect(result.current.zones[0].price).toBe(150);
  });

  it('addNewZone debería agregar zona en blanco', async () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: mockZones });

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.addNewZone();
    });

    expect(result.current.zones).toHaveLength(3);
    expect(result.current.zones[2].isNew).toBe(true);
    expect(result.current.zones[2].editing).toBe(true);
  });

  it('removeZone debería eliminar zona', async () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: mockZones });
    eventZoneService.delete.mockResolvedValue({});

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.removeZone(0);
    });

    expect(result.current.zones).toHaveLength(1);
  });

  it('validateBeforeSave debería detectar campos inválidos', async () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: mockZones });

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateZoneField(1, 'displayName', '');
    });

    const validation = result.current.validateBeforeSave();
    expect(validation.ok).toBe(false);
  });

  it('validateBeforeSave debería detectar precio negativo', async () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: mockZones });

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateZoneField(1, 'price', -10);
    });

    const validation = result.current.validateBeforeSave();
    expect(validation.ok).toBe(false);
  });

  it('saveZones debería crear y actualizar zonas', async () => {
    const newZones = [
      { ...mockZones[0], isNew: false },
      { id: null, displayName: 'Nueva', price: 30, seatsQuota: 100, isNew: true },
    ];
    eventZoneService.create.mockResolvedValue({ id: 3 });
    eventZoneService.update.mockResolvedValue({});

    const { result } = renderHook(() => useEventZones(mockEvent));

    await act(async () => {
      const saveResult = await result.current.saveZones({
        zones: newZones,
        eventId: 1,
      });
      expect(saveResult.ok).toBe(true);
    });

    expect(eventZoneService.create).toHaveBeenCalled();
    expect(eventZoneService.update).toHaveBeenCalled();
  });

  it('debería manejar evento sin zonas', async () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.zones).toHaveLength(0);
    expect(result.current.totals.totalSold).toBe(0);
  });

  it('debería manejar evento null', async () => {
    const { result } = renderHook(() => useEventZones(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.zones).toHaveLength(0);
    expect(eventZoneService.listByEvent).not.toHaveBeenCalled();
  });

  it('debería usar draftLocationId si se proporciona', () => {
    eventZoneService.listByEvent.mockResolvedValue({ data: [] });
    mockGetLocationCapacity.mockReturnValue(2000);

    renderHook(() => useEventZones(mockEvent, 20));

    expect(mockGetLocationCapacity).toHaveBeenCalledWith(
      expect.objectContaining({ locationId: 20 })
    );
  });

  it('debería manejar errores al cargar', async () => {
    eventZoneService.listByEvent.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it('debería normalizar zonas correctamente', async () => {
    const unnormalizedZones = [
      {
        id: 1,
        displayName: 'VIP',
        locationZone: { id: 10, name: 'Zona A' },
        price: '100',
        seatsQuota: '200',
      },
    ];
    eventZoneService.listByEvent.mockResolvedValue({ data: unnormalizedZones });

    const { result } = renderHook(() => useEventZones(mockEvent));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.zones[0].price).toBe(100);
    expect(result.current.zones[0].seatsQuota).toBe(200);
    expect(result.current.zones[0].locationZoneId).toBe(10);
  });
});
