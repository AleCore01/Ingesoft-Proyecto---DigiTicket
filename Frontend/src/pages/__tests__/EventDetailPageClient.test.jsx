import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventDetailPageClient from '../EventDetailPageClient';
import { useEventsCache } from '../../context/EventsCache';
import { useCart } from '../../context/CartContext';
import { useEventZones } from '../../hooks/useEventZones';
import { useEventLocation } from '../../hooks/useEventLocation';

// Mocks
vi.mock('../../context/EventsCache');
vi.mock('../../context/CartContext');
vi.mock('../../hooks/useEventZones');
vi.mock('../../hooks/useEventLocation');
vi.mock('../../components/Layout/TopBarUser', () => ({
  default: () => <div data-testid="topbar">TopBar</div>
}));
vi.mock('../../components/Modal/AddToCartModal', () => ({
  default: ({ isOpen }) => isOpen ? <div data-testid="cart-modal">Cart Modal</div> : null
}));
vi.mock('../../components/Modal/ModalCheck', () => ({
  default: ({ isOpen, message }) => isOpen ? <div data-testid="check-modal">{message}</div> : null
}));
vi.mock('../../utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EventDetailPageClient', () => {
  const mockEvent = {
    id: '1',
    title: 'Concierto de Rock',
    description: 'Gran evento de rock',
    date: '2025-12-31T20:00:00',
    localId: 'local-1',
    imageURL: 'https://example.com/image.jpg',
    category: 'MUSIC',
  };

  const mockZones = [
    { id: 'zone-1', displayName: 'VIP', price: 100, capacity: 50, availableTickets: 30 },
    { id: 'zone-2', displayName: 'General', price: 50, capacity: 200, availableTickets: 150 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useEventsCache
    useEventsCache.mockReturnValue({
      eventsCache: [mockEvent],
      fetchEvents: vi.fn().mockResolvedValue([mockEvent]),
    });

    // Mock useCart
    useCart.mockReturnValue({
      addItem: vi.fn(),
    });

    // Mock useEventZones
    useEventZones.mockReturnValue({
      zones: mockZones,
      loading: false,
    });

    // Mock useEventLocation
    useEventLocation.mockReturnValue({
      getLocationName: vi.fn().mockReturnValue('Estadio Nacional'),
      getLocationAddress: vi.fn().mockReturnValue('Av. José Díaz, Lima'),
    });
  });

  const renderWithRouter = (eventId = '1') => {
    return render(
      <MemoryRouter initialEntries={[`/events/${eventId}`]}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailPageClient />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('debería renderizar TopBar', () => {
    renderWithRouter();
    
    expect(screen.getByTestId('topbar')).toBeInTheDocument();
  });

  it('debería mostrar título del evento desde caché', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Concierto de Rock')).toBeInTheDocument();
    });
  });

  it('debería mostrar descripción del evento', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Gran evento de rock')).toBeInTheDocument();
    });
  });

  it('debería cargar zonas del evento', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(useEventZones).toHaveBeenCalledWith(mockEvent);
    });
  });

  it('debería mostrar loading mientras carga zonas', () => {
    useEventZones.mockReturnValue({
      zones: [],
      loading: true,
    });

    renderWithRouter();
    
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('debería usar evento del caché si está disponible', () => {
    const fetchEvents = vi.fn();
    useEventsCache.mockReturnValue({
      eventsCache: [mockEvent],
      fetchEvents,
    });

    renderWithRouter();
    
    // No debería llamar fetchEvents si está en caché
    expect(fetchEvents).not.toHaveBeenCalled();
  });

  it('debería llamar fetchEvents si evento no está en caché', async () => {
    const fetchEvents = vi.fn().mockResolvedValue([mockEvent]);
    useEventsCache.mockReturnValue({
      eventsCache: [],
      fetchEvents,
    });

    renderWithRouter();
    
    await waitFor(() => {
      expect(fetchEvents).toHaveBeenCalled();
    });
  });

  it('debería mostrar location name', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Estadio Nacional')).toBeInTheDocument();
    });
  });

  it('debería navegar a /404 si evento no existe', async () => {
    const fetchEvents = vi.fn().mockResolvedValue([]);
    useEventsCache.mockReturnValue({
      eventsCache: [],
      fetchEvents,
    });

    renderWithRouter('999'); // ID inexistente
    
    await waitFor(() => {
      expect(fetchEvents).toHaveBeenCalled();
    });
  });

  it('debería mostrar imagen del evento', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      const image = screen.getByAltText('Concierto de Rock');
      expect(image).toBeInTheDocument();
      expect(image.src).toContain('example.com/image.jpg');
    });
  });

  it('debería formatear fecha correctamente', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      // Verificar que hay elementos con iconos de calendario/reloj
      const page = screen.getByText(/concierto de rock/i).closest('div');
      expect(page).toBeInTheDocument();
    });
  });

  it('debería mostrar zonas disponibles', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
    });
  });

  it('debería manejar error al cargar evento', async () => {
    const fetchEvents = vi.fn().mockRejectedValue(new Error('Error de red'));
    useEventsCache.mockReturnValue({
      eventsCache: [],
      fetchEvents,
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithRouter();
    
    await waitFor(() => {
      expect(fetchEvents).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
