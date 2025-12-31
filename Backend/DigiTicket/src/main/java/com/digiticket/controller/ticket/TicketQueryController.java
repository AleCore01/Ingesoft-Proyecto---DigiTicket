package com.digiticket.controller.ticket;

import com.digiticket.dto.event.TicketTypeDTO;
import com.digiticket.service.ticket.TicketQueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST para consulta de tipos de tickets.
 * Solo operaciones de lectura - no crea órdenes ni realiza holds.
 */
@RestController
@RequestMapping("/api")
public class TicketQueryController {

    private final TicketQueryService ticketQueryService;

    public TicketQueryController(TicketQueryService ticketQueryService) {
        this.ticketQueryService = ticketQueryService;
    }

    /**
     * Obtiene todos los tipos de ticket disponibles para un evento específico
     * GET /api/events/{eventId}/tickets
     * 
     * @param eventId ID del evento
     * @return Lista de tipos de ticket con stock disponible
     */
    @GetMapping("/events/{eventId}/tickets")
    public ResponseEntity<List<TicketTypeDTO>> getTicketsByEvent(@PathVariable Integer eventId) {
        List<TicketTypeDTO> tickets = ticketQueryService.listByEvent(eventId);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Obtiene información detallada de un tipo de ticket específico
     * GET /api/tickets/{ticketTypeId}
     * 
     * @param ticketTypeId ID del tipo de ticket
     * @return Información del ticket con stock disponible
     */
    @GetMapping("/tickets/{ticketTypeId}")
    public ResponseEntity<TicketTypeDTO> getTicketById(@PathVariable Integer ticketTypeId) {
        TicketTypeDTO ticket = ticketQueryService.get(ticketTypeId);
        return ResponseEntity.ok(ticket);
    }

    /**
     * Obtiene solo el stock disponible de un tipo de ticket
     * GET /api/tickets/{ticketTypeId}/available-stock
     * 
     * @param ticketTypeId ID del tipo de ticket
     * @return Stock disponible
     */
    @GetMapping("/tickets/{ticketTypeId}/available-stock")
    public ResponseEntity<Map<String, Integer>> getAvailableStock(@PathVariable Integer ticketTypeId) {
        Integer availableStock = ticketQueryService.getAvailableStock(ticketTypeId);
        return ResponseEntity.ok(Map.of(
                "ticketTypeId", ticketTypeId,
                "availableStock", availableStock
        ));
    }
}
