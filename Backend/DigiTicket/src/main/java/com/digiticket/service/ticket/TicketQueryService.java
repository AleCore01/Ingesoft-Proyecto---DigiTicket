package com.digiticket.service.ticket;

import com.digiticket.dto.event.TicketTypeDTO;

import java.util.List;

/**
 * Servicio de consulta para tipos de tickets.
 * Solo operaciones de lectura - no crea órdenes ni realiza holds.
 */
public interface TicketQueryService {
    
    /**
     * Lista todos los tipos de ticket disponibles para un evento específico
     * @param eventId ID del evento
     * @return Lista de DTOs con información de tickets y stock disponible
     */
    List<TicketTypeDTO> listByEvent(Integer eventId);
    
    /**
     * Obtiene la información detallada de un tipo de ticket
     * @param ticketTypeId ID del tipo de ticket
     * @return DTO con información del ticket y stock disponible
     */
    TicketTypeDTO get(Integer ticketTypeId);
    
    /**
     * Obtiene el stock disponible de un tipo de ticket
     * Calcula: stock físico - holds vigentes
     * @param ticketTypeId ID del tipo de ticket
     * @return Cantidad de tickets disponibles
     */
    Integer getAvailableStock(Integer ticketTypeId);
}
