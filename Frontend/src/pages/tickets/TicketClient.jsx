import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { userTicketService } from '../../services/userTicketService';
import SideBarMenuClient from '../../components/Layout/SideBarMenuClient';
import TopBar from '../../components/Layout/TopBar';
import EventTicketCard from '../../components/Tickets/EventTicketCard';
import EventTicketListView from '../../components/Tickets/EventTicketListView';
import EventTicketColumnView from '../../components/Tickets/EventTicketColumnView';
import EventTicketGalleryView from '../../components/Tickets/EventTicketGalleryView';
import EventTicketsModal from '../../components/Tickets/EventTicketsModal';
import ViewModeSelector from '../../components/Tickets/ViewModeSelector';
import ModalCheck from '../../components/Modal/ModalCheck';
import TransferTicketModal from '../../components/Modal/TransferTicketModal';
import { Filter, Ticket as TicketIcon, Loader } from 'lucide-react';

const TicketClient = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [eventImages, setEventImages] = useState({}); // Map: eventId -> imageUrl
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, columns, gallery
  const [ticketToTransfer, setTicketToTransfer] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');

  const statuses = {
    all: { label: 'Todos', color: 'gray' },
    upcoming: { label: 'Próximos', color: 'green' },
    past: { label: 'Pasados', color: 'gray' }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    console.log('🔄 useEffect ejecutado - userId:', user.id);
    let cancelled = false;
    setLoading(true);
    
    const loadData = async () => {
      const startTime = performance.now();
      try {
        // Cargar tickets e imágenes en paralelo con medición individual
        const t1 = performance.now();
        const ticketsPromise = userTicketService.listByUser(user.id).then(res => {
          console.log(`📋 Tickets cargados en: ${(performance.now() - t1).toFixed(0)}ms`);
          return res;
        });
        const imagesPromise = userTicketService.getEventImages(user.id).then(res => {
          console.log(`🖼️ Imágenes cargadas en: ${(performance.now() - t1).toFixed(0)}ms`);
          return res;
        });
        
        const [ticketsResponse, imagesResponse] = await Promise.all([
          ticketsPromise,
          imagesPromise
        ]);
        
        if (cancelled) return;
        
        const t2 = performance.now();
        console.log(`⏱️ Total paralelo: ${(t2 - t1).toFixed(0)}ms`);
        console.log(`📊 Tickets: ${ticketsResponse.data?.length || 0} | Imágenes: ${imagesResponse.data?.length || 0}`);
        
        if (ticketsResponse.ok) {
          setTickets(ticketsResponse.data);
        }
        
        if (imagesResponse.ok) {
          // Crear mapa de eventId -> imagen
          const imagesMap = {};
          imagesResponse.data.forEach(img => {
            imagesMap[img.eventId] = img.eventImage;
          });
          setEventImages(imagesMap);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading tickets:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loadTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const startTime = performance.now();
    try {
      const t1 = performance.now();
      const [ticketsResponse, imagesResponse] = await Promise.all([
        userTicketService.listByUser(user.id),
        userTicketService.getEventImages(user.id)
      ]);
      const t2 = performance.now();
      
      console.log(`⏱️ Recarga: ${(t2 - t1).toFixed(0)}ms`);
      
      if (ticketsResponse.ok) {
        setTickets(ticketsResponse.data);
      }
      
      if (imagesResponse.ok) {
        const imagesMap = {};
        imagesResponse.data.forEach(img => {
          imagesMap[img.eventId] = img.eventImage;
        });
        setEventImages(imagesMap);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Memoizar agrupación de tickets por evento
  const events = useMemo(() => {
    const grouped = tickets.reduce((acc, ticket) => {
      const eventId = ticket.eventId;
      
      if (!acc[eventId]) {
        acc[eventId] = {
          eventId: ticket.eventId,
          eventTitle: ticket.eventTitle,
          eventImage: eventImages[eventId] || null, // Obtener imagen del mapa
          eventDate: ticket.eventDate,
          eventTime: ticket.eventTime,
          eventLocation: ticket.eventLocation,
          eventAddress: ticket.eventAddress,
          tickets: [],
          zones: {}
        };
      }
      
      acc[eventId].tickets.push(ticket);
      
      if (!acc[eventId].zones[ticket.zoneName]) {
        acc[eventId].zones[ticket.zoneName] = { name: ticket.zoneName, count: 0 };
      }
      acc[eventId].zones[ticket.zoneName].count++;
      
      return acc;
    }, {});

    const eventsList = Object.values(grouped).map(event => ({
      ...event,
      zones: Object.values(event.zones),
      status: event.tickets.some(t => t.status === 'active') ? 'active' : 
              event.tickets.every(t => t.status === 'used') ? 'used' : 'cancelled'
    }));

    return eventsList.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
  }, [tickets, eventImages]);

  // Memoizar filtrado de eventos
  const filteredEvents = useMemo(() => {
    const now = new Date();
    
    if (statusFilter === 'all') {
      return events;
    } else if (statusFilter === 'upcoming') {
      return events.filter(event => new Date(event.eventDate) >= now);
    } else if (statusFilter === 'past') {
      return events.filter(event => new Date(event.eventDate) < now);
    }
    return events;
  }, [statusFilter, events]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleOpenTransferModal = (ticket) => {
    setTicketToTransfer(ticket);
    setTransferError('');
    setShowTransferModal(true);
  };

  const handleCloseTransferModal = () => {
    setShowTransferModal(false);
    setTicketToTransfer(null);
    setTransferError('');
  };

  const handleTransfer = async (email, reason) => {
    if (!ticketToTransfer) return;
    setTransferLoading(true);
    setTransferError('');
    try {
      await userTicketService.transferTicket(ticketToTransfer.id, {
        destinationEmail: email,
        reason,
      });
      setShowTransferModal(false);
      setTicketToTransfer(null);
      setShowEventModal(false);
      setSuccessMessage('Ticket transferido exitosamente.');
      setShowSuccessModal(true);
      await loadTickets();
    } catch (error) {
      console.error('Error transferring ticket:', error);
      setTransferError(error?.message || 'No se pudo transferir el ticket.');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDownloadTicket = async (ticket) => {
    try {
      const response = await userTicketService.downloadTicket(ticket.id);
      if (response.ok) {
        setSuccessMessage(`Ticket ${ticket.ticketCode} descargado exitosamente`);
        setShowSuccessModal(true);
        console.log('Download URL:', response.data.url);
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
    }
  };

  const getFilterButtonStyle = (status) => {
    const baseStyle = "px-4 py-2 rounded-2xl font-medium text-sm transition";
    if (statusFilter === status) {
      return `${baseStyle} bg-fuchsia-600 text-white shadow-md`;
    }
    return `${baseStyle} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`;
  };

  // Determinar el layout según el modo de vista
  const getGridLayout = () => {
    switch (viewMode) {
      case 'list':
        return 'grid grid-cols-1 gap-4';
      case 'columns':
        return 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4';
      case 'gallery':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
      case 'grid':
      default:
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
    }
  };

  // Renderizar la tarjeta según el modo de vista
  const renderEventCard = (event) => {
    const props = {
      event,
      ticketCount: event.tickets.length,
      onClick: () => handleEventClick(event)
    };

    switch (viewMode) {
      case 'list':
        return <EventTicketListView key={event.eventId} {...props} />;
      case 'columns':
        return <EventTicketColumnView key={event.eventId} {...props} />;
      case 'gallery':
        return <EventTicketGalleryView key={event.eventId} {...props} />;
      case 'grid':
      default:
        return <EventTicketCard key={event.eventId} {...props} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-backgroundGeneral">
      <div className="flex h-screen">
        <SideBarMenuClient />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Tickets</h1>
              <p className="text-gray-600">
                Gestiona tus entradas y descarga tus tickets para los eventos
              </p>
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Filter size={18} />
                  <span className="font-medium">Filtrar por estado:</span>
                </div>
                {Object.entries(statuses).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={getFilterButtonStyle(key)}
                  >
                    {value.label}
                  </button>
                ))}
              </div>

              {/* Selector de vista */}
              <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="animate-spin text-fuchsia-600" size={48} />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <TicketIcon size={80} className="mx-auto text-gray-300 mb-6" />
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  No hay eventos
                </h3>
                <p className="text-gray-500">
                  {statusFilter === 'all'
                    ? 'Aún no has comprado tickets para ningún evento'
                    : statusFilter === 'upcoming'
                    ? 'No tienes eventos próximos'
                    : 'No tienes eventos pasados'}
                </p>
              </div>
            ) : (
              <div className={getGridLayout()}>
                {filteredEvents.map(event => renderEventCard(event))}
              </div>
            )}
          </div>
        </div>
      </div>

      <EventTicketsModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={handleCloseEventModal}
        onDownload={handleDownloadTicket}
        onTransfer={handleOpenTransferModal}
      />

      <TransferTicketModal
        ticket={ticketToTransfer}
        isOpen={showTransferModal}
        onClose={handleCloseTransferModal}
        onSubmit={handleTransfer}
        loading={transferLoading}
        error={transferError}
      />

      <ModalCheck
        isOpen={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
};

export default TicketClient;
