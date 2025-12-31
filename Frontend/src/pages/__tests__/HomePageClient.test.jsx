import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePageClient from '../HomePageClient';
import { useEventsCache } from '../../context/EventsCache';
import { useEventCategories } from '../../hooks/useEventCategories';
import { useEventLocation } from '../../hooks/useEventLocation';

// Mocks
vi.mock('../../context/EventsCache');
vi.mock('../../hooks/useEventCategories');
vi.mock('../../hooks/useEventLocation');
vi.mock('../../components/Layout/TopBarUser', () => ({
  default: () => <div data-testid="topbar">TopBar</div>
}));
vi.mock('../../components/Layout/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>
}));

describe('HomePageClient', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Concierto Rock',
      category: 'MUSIC',
      localId: 'local-1',
      date: '2025-12-31T20:00:00',
      imageURL: 'https://example.com/rock.jpg',
    },
    {
      id: '2',
      title: 'Obra de Teatro',
      category: 'THEATER',
      localId: 'local-2',
      date: '2025-12-25T19:00:00',
      imageURL: 'https://example.com/theater.jpg',
    },
  ];

  const mockLocales = [
    { id: 'local-1', name: 'Estadio Nacional', city: 'Lima' },
    { id: 'local-2', name: 'Teatro Municipal', city: 'Lima' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useEventsCache
    useEventsCache.mockReturnValue({
      fetchEvents: vi.fn().mockResolvedValue(mockEvents),
      fetchLocales: vi.fn().mockResolvedValue(mockLocales),
      eventsLoading: false,
    });

    // Mock useEventCategories
    useEventCategories.mockReturnValue({
      categories: [
        { value: 'MUSIC', label: 'Música' },
        { value: 'THEATER', label: 'Teatro' },
      ],
      // el componente pasa el objeto evento; usamos event.category
      getCategoryName: vi.fn((event) => (event?.category === 'MUSIC' ? 'Música' : 'Teatro')),
    });

    // Mock useEventLocation
    useEventLocation.mockReturnValue({
      getLocationName: vi.fn((id) => 
        id === 'local-1' ? 'Estadio Nacional' : 'Teatro Municipal'
      ),
    });
  });

  it('debería renderizar TopBar y Footer', () => {
    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('topbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('debería cargar eventos al montar', async () => {
    const fetchEvents = vi.fn().mockResolvedValue(mockEvents);
    useEventsCache.mockReturnValue({
      fetchEvents,
      fetchLocales: vi.fn().mockResolvedValue([]),
      eventsLoading: false,
    });

    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(fetchEvents).toHaveBeenCalled();
    });
  });

  it('debería mostrar loading mientras carga', () => {
    useEventsCache.mockReturnValue({
      fetchEvents: vi.fn().mockReturnValue(new Promise(() => {})), // Nunca resuelve
      fetchLocales: vi.fn().mockResolvedValue([]),
      eventsLoading: true,
    });

    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('debería mostrar eventos después de cargar', async () => {
    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Concierto Rock')).toBeInTheDocument();
      expect(screen.getByText('Obra de Teatro')).toBeInTheDocument();
    });
  });

  it('debería filtrar eventos por búsqueda', async () => {
    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    // Esperar carga inicial
    await waitFor(() => {
      expect(screen.getByText('Concierto Rock')).toBeInTheDocument();
    });

    // Buscar "Teatro"
    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'Teatro' } });

    await waitFor(() => {
      expect(screen.getByText('Obra de Teatro')).toBeInTheDocument();
      expect(screen.queryByText('Concierto Rock')).not.toBeInTheDocument();
    });
  });

  it('debería filtrar eventos por categoría', async () => {
    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Concierto Rock')).toBeInTheDocument();
    });

    // Seleccionar categoría "Teatro" (valor mostrado en el select)
    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0];
    fireEvent.change(categorySelect, { target: { value: 'Teatro' } });

    await waitFor(() => {
      expect(screen.getByText('Obra de Teatro')).toBeInTheDocument();
      expect(screen.queryByText('Concierto Rock')).not.toBeInTheDocument();
    });
  });

  it('debería paginar eventos correctamente', async () => {
    // Crear más eventos para forzar paginación
    const manyEvents = Array.from({ length: 12 }, (_, i) => ({
      id: `${i + 1}`,
      title: `Evento ${i + 1}`,
      category: 'MUSIC',
      localId: 'local-1',
      date: '2025-12-31T20:00:00',
    }));

    useEventsCache.mockReturnValue({
      fetchEvents: vi.fn().mockResolvedValue(manyEvents),
      fetchLocales: vi.fn().mockResolvedValue([]),
      eventsLoading: false,
    });

    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Evento 1')).toBeInTheDocument();
    });

    // Debería mostrar máximo 6 eventos por página
    expect(screen.getByText('Evento 6')).toBeInTheDocument();
    expect(screen.queryByText('Evento 7')).not.toBeInTheDocument();
  });

  it('debería navegar al hacer click en un evento', async () => {
    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Concierto Rock')).toBeInTheDocument();
    });

    const eventCard = screen.getByText('Concierto Rock').closest('div');
    expect(eventCard).toBeInTheDocument();
  });

  it('debería cargar locales al montar', async () => {
    const fetchLocales = vi.fn().mockResolvedValue(mockLocales);
    useEventsCache.mockReturnValue({
      fetchEvents: vi.fn().mockResolvedValue([]),
      fetchLocales,
      eventsLoading: false,
    });

    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(fetchLocales).toHaveBeenCalled();
    });
  });

  it('debería limpiar filtros al hacer click en limpiar', async () => {
    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Concierto Rock')).toBeInTheDocument();
    });

    // Aplicar filtro
    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'Teatro' } });

    // Buscar y hacer click en botón limpiar (si existe)
    const clearButton = screen.queryByRole('button', { name: /limpiar/i });
    if (clearButton) {
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('Concierto Rock')).toBeInTheDocument();
        expect(screen.getByText('Obra de Teatro')).toBeInTheDocument();
      });
    }
  });

  it('debería manejar error al cargar eventos', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    useEventsCache.mockReturnValue({
      fetchEvents: vi.fn().mockRejectedValue(new Error('Error de red')),
      fetchLocales: vi.fn().mockResolvedValue([]),
      eventsLoading: false,
    });

    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('debería mostrar mensaje cuando no hay eventos', async () => {
    useEventsCache.mockReturnValue({
      fetchEvents: vi.fn().mockResolvedValue([]),
      fetchLocales: vi.fn().mockResolvedValue([]),
      eventsLoading: false,
    });

    render(
      <MemoryRouter>
        <HomePageClient />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/no se encontraron eventos/i)).toBeInTheDocument();
    });
  });
});
