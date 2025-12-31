package com.digiticket.controller.ticket;

import com.digiticket.domain.event.Event;
import com.digiticket.dto.ticket.EventImageDTO;
import com.digiticket.dto.ticket.UserTicketDTO;
import com.digiticket.mapper.ticket.UserTicketMapper;
import com.digiticket.repository.event.EventRepository;
import com.digiticket.repository.ticket.TicketRepository;
import com.digiticket.repository.user.ClientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user/tickets")
public class UserTicketsController {

    private final TicketRepository ticketRepository;
    private final ClientRepository clientRepository;
    private final UserTicketMapper mapper;
    private final EventRepository eventRepository;

    public UserTicketsController(TicketRepository ticketRepository,
                                 ClientRepository clientRepository,
                                 UserTicketMapper mapper,
                                 EventRepository eventRepository) {
        this.ticketRepository = ticketRepository;
        this.clientRepository = clientRepository;
        this.mapper = mapper;
        this.eventRepository = eventRepository;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<UserTicketDTO>> listByUser(@PathVariable Integer userId) {
        var client = clientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found for user"));

        long startTime = System.currentTimeMillis();
        
        // 1. Cargar tickets con Purchase (NO cargará Event completo)
        var tickets = ticketRepository.findAllByOwnerClientIdWithDetails(client.getId());
        long afterTickets = System.currentTimeMillis();
        
        // 2. Obtener IDs de eventos y cargar INFO BÁSICA SIN imageData usando proyección
        var eventIds = tickets.stream()
                .map(t -> t.getPurchase() != null && t.getPurchase().getEvent() != null 
                    ? t.getPurchase().getEvent().getId() // Solo ID, no inicializa el resto
                    : null)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        
        var eventInfoMap = eventIds.isEmpty() ? java.util.Map.<Integer, com.digiticket.dto.event.EventBasicProjection>of() :
                eventRepository.findBasicInfoByIds(eventIds).stream()
                        .collect(Collectors.toMap(
                            com.digiticket.dto.event.EventBasicProjection::getId, 
                            e -> e
                        ));
        
        long afterEvents = System.currentTimeMillis();
        
        // 3. Mapear usando la info básica de eventos (sin tocar las entidades Event)
        List<UserTicketDTO> dtos = mapper.toDtoListWithEventInfo(tickets, eventInfoMap);
        long afterMapping = System.currentTimeMillis();
        
        System.out.println("📋 GET /tickets - Tickets: " + (afterTickets - startTime) + "ms | Events: " + (afterEvents - afterTickets) + "ms | Mapping: " + (afterMapping - afterEvents) + "ms");

        return ResponseEntity.ok(dtos);
    }

    /**
     * Endpoint optimizado: devuelve solo las imágenes únicas de eventos
     * sin cargar todos los tickets (solo queries por IDs)
     */
    @GetMapping("/{userId}/event-images")
    public ResponseEntity<List<EventImageDTO>> getEventImages(@PathVariable Integer userId) {
        var client = clientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found for user"));

        long startTime = System.currentTimeMillis();
        
        // 1. Query rápida: solo obtener IDs únicos de eventos (sin cargar datos)
        var eventIds = ticketRepository.findDistinctEventIdsByClientId(client.getId());
        long afterIdsQuery = System.currentTimeMillis();
        
        if (eventIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        
        // 2. Query selectiva: cargar solo los eventos necesarios con sus imágenes
        var events = eventRepository.findByIdIn(eventIds);
        long afterEventsQuery = System.currentTimeMillis();
        
        List<EventImageDTO> eventImages = events.stream()
                .filter(event -> event.getImageData() != null && event.getImageData().length > 0)
                .map(event -> new EventImageDTO(
                        event.getId(),
                        "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(event.getImageData())
                ))
                .collect(Collectors.toList());
        long afterBase64 = System.currentTimeMillis();
        
        System.out.println("🖼️ GET /event-images - IDs: " + (afterIdsQuery - startTime) + "ms | Events: " + (afterEventsQuery - afterIdsQuery) + "ms | Base64: " + (afterBase64 - afterEventsQuery) + "ms");

        return ResponseEntity.ok(eventImages);
    }
}
