import { mockUserTickets, mockTicketStatuses } from '../mocks/ticketsData';
import { api } from './http';

const USE_MOCK_DATA = false; // usar backend real para Mis Entradas

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const userTicketService = {
  listByUser: async (userId) => {
    if (USE_MOCK_DATA) {
      await delay(500);
      return {
        ok: true,
        data: mockUserTickets.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
      };
    }
    // Backend: /api/user/tickets/{userId}
    const data = await api.get(`api/user/tickets/${userId}`);
    // Normaliza claves para la vista usando imagen del backend
    const normalized = data.map(t => ({
      id: t.id,
      orderId: t.orderId,
      eventId: t.eventId,
      eventTitle: t.eventTitle || `Evento #${t.eventId}`,
      eventDate: t.eventDate,
      eventTime: t.eventDate,
      eventLocation: t.eventLocation,
      eventAddress: t.eventAddress,
      zoneName: t.zoneName || 'General',
      price: Number(t.price),
      purchaseDate: t.purchaseDate,
      status: t.status || 'active',
      ticketCode: `TKT-${t.orderId}-${t.id}`,
      isUsed: false,
      usedDate: null,
      ownerClientId: t.ownerClientId,
      transferCount: t.transferCount,
      ticketUrl: t.ticketUrl,
      isPresale: t.isPresale,
    }));
    return { ok: true, data: normalized };
  },

  getById: async (ticketId) => {
    if (USE_MOCK_DATA) {
      await delay(300);
      const ticket = mockUserTickets.find(t => t.id === parseInt(ticketId));
      if (!ticket) {
        return { ok: false, error: 'Ticket not found' };
      }
      return { ok: true, data: ticket };
    }
    
    throw new Error('Backend endpoint not implemented yet');
  },

  getByOrder: async (orderId) => {
    if (USE_MOCK_DATA) {
      await delay(400);
      const tickets = mockUserTickets.filter(t => t.orderId === parseInt(orderId));
      return { ok: true, data: tickets };
    }
    
    throw new Error('Backend endpoint not implemented yet');
  },

  getStatuses: () => {
    return mockTicketStatuses;
  },

  filterByStatus: async (userId, status) => {
    if (USE_MOCK_DATA) {
      await delay(400);
      const tickets = mockUserTickets.filter(t => t.status === status);
      return {
        ok: true,
        data: tickets.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
      };
    }
    
    throw new Error('Backend endpoint not implemented yet');
  },

  downloadTicket: async (ticketId) => {
    if (USE_MOCK_DATA) {
      await delay(800);
      const ticket = mockUserTickets.find(t => t.id === ticketId);
      if (!ticket) {
        return { ok: false, error: 'Ticket not found' };
      }
      return { 
        ok: true, 
        data: { 
          url: `ticket-${ticket.ticketCode}.pdf`,
          ticket 
        } 
      };
    }
    
    throw new Error('Backend endpoint not implemented yet');
  },

  transferTicket: async (ticketId, payload) => {
    return api.post(`api/tickets/${ticketId}/transfer`, payload);
  },

  /**
   * Obtiene solo las imágenes únicas de eventos (optimización)
   * para evitar descargar la misma imagen múltiples veces
   */
  getEventImages: async (userId) => {
    if (USE_MOCK_DATA) {
      await delay(300);
      // Para mock, obtener imágenes únicas
      const uniqueEvents = new Map();
      mockUserTickets.forEach(t => {
        if (t.eventId && t.eventImage && !uniqueEvents.has(t.eventId)) {
          uniqueEvents.set(t.eventId, t.eventImage);
        }
      });
      const images = Array.from(uniqueEvents.entries()).map(([eventId, eventImage]) => ({
        eventId,
        eventImage
      }));
      return { ok: true, data: images };
    }
    
    const data = await api.get(`api/user/tickets/${userId}/event-images`);
    return { ok: true, data };
  }
};
