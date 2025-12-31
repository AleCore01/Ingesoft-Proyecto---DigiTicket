package com.digiticket.mapper.ticket;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventZone;
import com.digiticket.domain.order.Purchase;
import com.digiticket.domain.ticket.Ticket;
import com.digiticket.dto.ticket.UserTicketDTO;
import com.digiticket.repository.event.EventZoneRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Base64;

@Component
public class UserTicketMapper {

    private final EventZoneRepository eventZoneRepository;

    public UserTicketMapper(EventZoneRepository eventZoneRepository) {
        this.eventZoneRepository = eventZoneRepository;
    }

    /**
     * NUEVO: Mapear tickets usando información básica de eventos (SIN tocar entidades Event)
     * para evitar cargar imageData
     */
    public java.util.List<UserTicketDTO> toDtoListWithEventInfo(
            java.util.List<Ticket> tickets,
            java.util.Map<Integer, ?> eventInfoMap) {
        if (tickets.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        // Precargar todas las zonas de una sola vez
        var zoneIds = tickets.stream()
                .map(Ticket::getEventZoneId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        var zonesMap = eventZoneRepository.findAllById(zoneIds)
                .stream()
                .collect(java.util.stream.Collectors.toMap(EventZone::getId, z -> z));

        // Mapear tickets usando el mapa precargado Y la info básica de eventos
        return tickets.stream()
                .map(ticket -> toDtoWithMaps(ticket, zonesMap, eventInfoMap))
                .toList();
    }
    
    /**
     * Optimización: convertir lista completa precargando todas las zonas de una vez
     * para evitar el problema N+1
     */
    public java.util.List<UserTicketDTO> toDtoList(java.util.List<Ticket> tickets) {
        if (tickets.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        // Precargar todas las zonas de una sola vez
        var zoneIds = tickets.stream()
                .map(Ticket::getEventZoneId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        var zonesMap = eventZoneRepository.findAllById(zoneIds)
                .stream()
                .collect(java.util.stream.Collectors.toMap(EventZone::getId, z -> z));

        // Mapear tickets usando el mapa precargado
        return tickets.stream()
                .map(ticket -> toDtoWithZoneMap(ticket, zonesMap))
                .toList();
    }

    /**
     * Mapear usando info básica de eventos (proyección) para NO tocar entidades Event
     */
    private UserTicketDTO toDtoWithMaps(Ticket ticket, java.util.Map<Integer, EventZone> zonesMap, java.util.Map<Integer, ?> eventInfoMap) {
        Purchase purchase = ticket.getPurchase();
        Integer eventId = purchase != null && purchase.getEvent() != null ? purchase.getEvent().getId() : null;
        Object eventInfo = eventId != null ? eventInfoMap.get(eventId) : null;
        
        EventZone zone = ticket.getEventZoneId() != null
                ? zonesMap.get(ticket.getEventZoneId())
                : null;

        // Extraer datos de la proyección (cast seguro porque sabemos que es EventBasicProjection)
        String eventTitle = null;
        LocalDateTime eventDate = null;
        String locationName = null;
        String locationAddress = null;
        
        if (eventInfo != null) {
            try {
                var projection = (com.digiticket.dto.event.EventBasicProjection) eventInfo;
                eventTitle = projection.getTitle();
                eventDate = projection.getStartsAt();
                locationName = projection.getLocationName();
                locationAddress = projection.getLocationAddress();
            } catch (Exception e) {
                // Fallback silencioso
            }
        }
        
        String zoneName = zone != null ? zone.getDisplayName() : null;
        BigDecimal price = zone != null ? zone.getPrice() : null;

        return new UserTicketDTO(
                ticket.getId(),
                purchase != null ? purchase.getId() : null,
                eventId,
                eventTitle,
                zoneName,
                price,
                purchase != null ? purchase.getCreatedAt() : ticket.getCreatedAt(),
                ticket.getStatus() != null ? ticket.getStatus().name().toLowerCase() : null,
                eventDate,
                locationName,
                locationAddress,
                ticket.getOwnerClientId(),
                ticket.getTransferCount(),
                ticket.getTicketUrl(),
                ticket.isPresale()
        );
    }

    private UserTicketDTO toDtoWithZoneMap(Ticket ticket, java.util.Map<Integer, EventZone> zonesMap) {
        Purchase purchase = ticket.getPurchase();
        Event event = purchase != null ? purchase.getEvent() : null;
        EventZone zone = ticket.getEventZoneId() != null
                ? zonesMap.get(ticket.getEventZoneId())
                : null;

        if (event == null && zone != null) {
            event = zone.getEvent();
        }

        String eventTitle = event != null ? event.getTitle() : null;
        LocalDateTime eventDate = event != null ? event.getStartsAt() : null;
        String locationName = event != null && event.getLocation() != null ? event.getLocation().getName() : null;
        String locationAddress = event != null && event.getLocation() != null ? event.getLocation().getAddress() : null;
        String zoneName = zone != null ? zone.getDisplayName() : null;
        BigDecimal price = zone != null ? zone.getPrice() : null;

        return new UserTicketDTO(
                ticket.getId(),
                purchase != null ? purchase.getId() : null,
                event != null ? event.getId() : null,
                eventTitle,
                zoneName,
                price,
                purchase != null ? purchase.getCreatedAt() : ticket.getCreatedAt(),
                ticket.getStatus() != null ? ticket.getStatus().name().toLowerCase() : null,
                eventDate,
                locationName,
                locationAddress,
                ticket.getOwnerClientId(),
                ticket.getTransferCount(),
                ticket.getTicketUrl(),
                ticket.isPresale()
        );
    }

    public UserTicketDTO toDto(Ticket ticket) {
        Purchase purchase = ticket.getPurchase();
        Event event = purchase != null ? purchase.getEvent() : null;
        EventZone zone = ticket.getEventZoneId() != null
                ? eventZoneRepository.findById(ticket.getEventZoneId()).orElse(null)
                : null;

        if (event == null && zone != null) {
            event = zone.getEvent();
        }

        String eventTitle = event != null ? event.getTitle() : null;
        LocalDateTime eventDate = event != null ? event.getStartsAt() : null;
        String locationName = event != null && event.getLocation() != null ? event.getLocation().getName() : null;
        String locationAddress = event != null && event.getLocation() != null ? event.getLocation().getAddress() : null;
        String zoneName = zone != null ? zone.getDisplayName() : null;
        BigDecimal price = zone != null ? zone.getPrice() : null;

        return new UserTicketDTO(
                ticket.getId(),
                purchase != null ? purchase.getId() : null,
                event != null ? event.getId() : null,
                eventTitle,
                zoneName,
                price,
                purchase != null ? purchase.getCreatedAt() : ticket.getCreatedAt(),
                ticket.getStatus() != null ? ticket.getStatus().name().toLowerCase() : null,
                eventDate,
                locationName,
                locationAddress,
                ticket.getOwnerClientId(),
                ticket.getTransferCount(),
                ticket.getTicketUrl(),
                ticket.isPresale()
        );
    }
}
