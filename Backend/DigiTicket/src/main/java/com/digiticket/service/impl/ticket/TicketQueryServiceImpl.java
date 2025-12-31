package com.digiticket.service.impl.ticket;

import com.digiticket.domain.event.TicketType;
import com.digiticket.dto.event.TicketTypeDTO;
import com.digiticket.repository.event.EventRepository;
import com.digiticket.repository.event.TicketTypeRepository;
import com.digiticket.service.ticket.TicketQueryService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de consulta de tipos de tickets.
 * Solo lectura - no modifica datos, no crea órdenes, no realiza holds.
 */
@Service
@Transactional(readOnly = true)
public class TicketQueryServiceImpl implements TicketQueryService {

    private final TicketTypeRepository ticketTypeRepository;
    private final EventRepository eventRepository;

    public TicketQueryServiceImpl(TicketTypeRepository ticketTypeRepository,
                                  EventRepository eventRepository) {
        this.ticketTypeRepository = ticketTypeRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    public List<TicketTypeDTO> listByEvent(Integer eventId) {
        // Verificar que el evento existe
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Event not found with id: " + eventId));

        // Obtener tipos de ticket ordenados por precio
        List<TicketType> ticketTypes = ticketTypeRepository.findByEventIdOrderByPriceAsc(eventId);

        // Convertir a DTOs con stock disponible
        return ticketTypes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TicketTypeDTO get(Integer ticketTypeId) {
        TicketType ticketType = ticketTypeRepository.findById(ticketTypeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "TicketType not found with id: " + ticketTypeId));

        return convertToDTO(ticketType);
    }

    @Override
    public Integer getAvailableStock(Integer ticketTypeId) {
        Integer stock = ticketTypeRepository.getAvailableStock(ticketTypeId);
        
        if (stock == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "TicketType not found with id: " + ticketTypeId);
        }

        return stock;
    }

    /**
     * Convierte una entidad TicketType a DTO incluyendo el cálculo de stock disponible
     */
    private TicketTypeDTO convertToDTO(TicketType ticketType) {
        Integer availableStock = ticketTypeRepository.getAvailableStock(ticketType.getId());

        return TicketTypeDTO.builder()
                .id(ticketType.getId())
                .eventId(ticketType.getEvent().getId())
                .name(ticketType.getName())
                .price(ticketType.getPrice())
                .stock(ticketType.getStock())
                .availableStock(availableStock != null ? availableStock : 0)
                .build();
    }
}
