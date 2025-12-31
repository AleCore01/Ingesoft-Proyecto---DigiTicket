package com.digiticket.controller.event;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventStatus;
import com.digiticket.dto.event.EventDTO;
import com.digiticket.mapper.EventMapper;
import com.digiticket.service.event.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/event")
public class EventController {

    @Autowired
    private EventService eventService;

    // Crear un nuevo evento
    @PostMapping("/add")
    public ResponseEntity<?> create(@RequestBody EventDTO dto) {
        try {
            // DTO → Entidad
            Event event = EventMapper.toEntity(dto);

            // Guardar
            Event saved = eventService.createEvent(event);

            // Entidad → DTO
            EventDTO response = EventMapper.toDTO(saved);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", ex.getClass().getSimpleName(), "message", ex.getMessage()));
        }
    }

    // Listar todos los eventos
    @GetMapping("/all")
    public List<EventDTO> getAll() {
        List<Event> events = eventService.getAllEvents();
        return events.stream()
                .map(EventMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Buscar por ID
    @GetMapping("/{id}")
    public EventDTO getById(@PathVariable Integer id) {
        Event event = eventService.getEventById(id);
        return EventMapper.toDTO(event);
    }

    // Actualizar evento
    @PutMapping("/update/{id}")
    public EventDTO update(@PathVariable Integer id, @RequestBody EventDTO eventDTO) {
        Event event = EventMapper.toEntity(eventDTO);
        Event updated = eventService.updateEvent(id, event);
        return EventMapper.toDTO(updated);
    }

    // Eliminar evento
    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Integer id) {
        eventService.deleteEvent(id);
    }

    // Publicar evento
    @PostMapping("/{id}/publish")
    public EventDTO publish(@PathVariable Integer id) {
        Event updated = eventService.publishEvent(id);
        return EventMapper.toDTO(updated);
    }

    // Cancelar evento
    @PostMapping("/{id}/cancel")
    public EventDTO cancel(@PathVariable Integer id) {
        Event updated = eventService.cancelEvent(id);
        return EventMapper.toDTO(updated);
    }

    // Finalizar evento
    @PostMapping("/{id}/finish")
    public EventDTO finish(@PathVariable Integer id) {
        Event updated = eventService.finishEvent(id);
        return EventMapper.toDTO(updated);
    }


    @GetMapping("/search")
    public List<EventDTO> searchEvents(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        List<Event> events = eventService.searchEvents(title, status, locationId, from, to);

        return events.stream()
                .map(EventMapper::toDTO)
                .collect(Collectors.toList());
    }
}