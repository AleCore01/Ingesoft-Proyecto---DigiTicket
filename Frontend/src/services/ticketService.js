// src/services/ticketService.js
import { api } from './http'
import { TICKETS_PREFIX, EVENT_PREFIX } from '../constants/api'
import { eventZoneService } from './eventZoneService'

/**
 * Servicio para Catálogo de Entradas (Dev 1)
 * 
 * DTOs del Backend:
 * - TicketTypeDTO { id, eventId, name, price, stockAvailable }
 * 
 * Nota: Este módulo es SOLO LECTURA
 * - No crea órdenes
 * - No hace holds
 * - Calcula stock disponible = stock físico - holds vigentes
 * 
 * IMPLEMENTACIÓN ACTUAL:
 * - Usa eventZoneService como base (ya implementado)
 * - Adaptador para cumplir con el contrato del backend
 */
export const ticketService = {
  /**
   * GET /api/events/{eventId}/tickets (o adaptado desde eventZone)
   * Lista todos los tipos de tickets disponibles para un evento
   * 
   * @param {number} eventId - ID del evento
   * @returns {Promise<TicketTypeDTO[]>} Lista de tipos de tickets con stock disponible
   */
  listByEvent: async (eventId) => {
    console.log(`🔄 [ticketService] Obteniendo tickets para evento ${eventId}`)
    
    try {
      // Intentar endpoint oficial del backend (Dev 1)
      const response = await api.get(`${EVENT_PREFIX}/${eventId}/tickets`)
      console.log('  ✅ Usando endpoint oficial: /api/events/{id}/tickets')
      return response?.data ?? response
    } catch (error) {
      // Fallback: usar eventZoneService (implementación actual)
      console.log('  ℹ️  Fallback: usando eventZoneService')
      const zones = await eventZoneService.listByEvent(eventId)
      const data = zones?.data ?? zones
      
      // Adaptar EventZone[] a TicketTypeDTO[]
      return (Array.isArray(data) ? data : []).map(zone => ({
        id: zone.id,
        eventId: eventId,
        name: zone.displayName,
        price: zone.price,
        stockAvailable: zone.seatsAvailable ?? (zone.seatsQuota - zone.seatsSold)
      }))
    }
  },

  /**
   * GET /api/tickets/{ticketTypeId} (o adaptado desde eventZone)
   * Obtiene información detallada de un tipo de ticket específico
   * 
   * @param {number} ticketTypeId - ID del tipo de ticket
   * @returns {Promise<TicketTypeDTO>} { id, eventId, name, price, stockAvailable }
   */
  get: async (ticketTypeId) => {
    console.log(`🔄 [ticketService] Obteniendo ticket ${ticketTypeId}`)
    
    try {
      // Intentar endpoint oficial del backend (Dev 1)
      const response = await api.get(`${TICKETS_PREFIX}/${ticketTypeId}`)
      console.log('  ✅ Usando endpoint oficial: /api/tickets/{id}')
      return response?.data ?? response
    } catch (error) {
      // Fallback: usar eventZoneService
      console.log('  ℹ️  Fallback: usando eventZoneService')
      const zone = await eventZoneService.getById(ticketTypeId)
      const data = zone?.data ?? zone
      
      // Adaptar EventZone a TicketTypeDTO
      return {
        id: data.id,
        eventId: data.eventId,
        name: data.displayName,
        price: data.price,
        stockAvailable: data.seatsAvailable ?? (data.seatsQuota - data.seatsSold)
      }
    }
  },

  /**
   * Helper: Obtiene el stock disponible de un tipo de ticket
   * 
   * @param {number} ticketTypeId - ID del tipo de ticket
   * @returns {Promise<number>} Stock disponible
   */
  getAvailableStock: async (ticketTypeId) => {
    console.log(`🔄 [ticketService] Obteniendo stock disponible para ticket ${ticketTypeId}`)
    const ticket = await ticketService.get(ticketTypeId)
    return ticket?.stockAvailable ?? 0
  },
}
