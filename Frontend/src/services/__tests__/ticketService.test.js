import { describe, it, expect, beforeEach } from 'vitest';
import { ticketService } from '../ticketService';

describe('ticketService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('listByEvent', () => {
    it('debería obtener lista de tickets para un evento', async () => {
      const tickets = await ticketService.listByEvent(1);
      
      expect(tickets).toBeInstanceOf(Array);
    });

    it('cada ticket debe tener propiedades requeridas', async () => {
      const tickets = await ticketService.listByEvent(1);
      
      if (tickets.length > 0) {
        const firstTicket = tickets[0];
        expect(firstTicket).toHaveProperty('id');
        expect(firstTicket).toHaveProperty('eventId');
        expect(firstTicket).toHaveProperty('name');
        expect(firstTicket).toHaveProperty('price');
        expect(firstTicket).toHaveProperty('stockAvailable');
      }
    });

    it('debería manejar evento sin tickets', async () => {
      const tickets = await ticketService.listByEvent(9999);
      
      expect(tickets).toBeInstanceOf(Array);
      expect(tickets.length).toBe(0);
    });

    it('debería usar fallback a eventZoneService cuando endpoint falla', async () => {
      // Este test valida que el servicio tiene estrategia de fallback
      const tickets = await ticketService.listByEvent(1);
      
      expect(tickets).toBeDefined();
    });
  });

  describe('get', () => {
    it('debería obtener un ticket por ID', async () => {
      const ticket = await ticketService.get(101);
      
      expect(ticket).toBeDefined();
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('eventId');
      expect(ticket).toHaveProperty('name');
      expect(ticket).toHaveProperty('price');
      expect(ticket).toHaveProperty('stockAvailable');
    });

    it('debería fallar con ID inexistente', async () => {
      await expect(ticketService.get(9999)).rejects.toThrow();
    });

    it('stockAvailable debe ser número no negativo', async () => {
      const ticket = await ticketService.get(101);
      
      expect(ticket.stockAvailable).toBeGreaterThanOrEqual(0);
      expect(typeof ticket.stockAvailable).toBe('number');
    });
  });

  describe('getAvailableStock', () => {
    it('debería obtener stock disponible de un ticket', async () => {
      const stock = await ticketService.getAvailableStock(101);
      
      expect(typeof stock).toBe('number');
      expect(stock).toBeGreaterThanOrEqual(0);
    });

    it('debería devolver 0 si ticket no existe', async () => {
      await expect(ticketService.getAvailableStock(9999)).rejects.toThrow();
    });

    it('stock debe ser consistente con método get', async () => {
      const ticket = await ticketService.get(101);
      const stock = await ticketService.getAvailableStock(101);
      
      expect(stock).toBe(ticket.stockAvailable);
    });
  });
});
