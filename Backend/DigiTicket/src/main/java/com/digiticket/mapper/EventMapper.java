package com.digiticket.mapper;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventStatus;
import com.digiticket.dto.event.EventDTO;

import java.util.Base64;

public class EventMapper {

    // Convierte de entidad → DTO
    public static EventDTO toDTO(Event event) {
        if (event == null) return null;

        EventDTO dto = new EventDTO();
        dto.setId(event.getId());
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setStartsAt(event.getStartsAt());
        dto.setSalesStartAt(event.getSalesStartAt());
        dto.setDurationMin(event.getDurationMin());

        // Relacionales como IDs
        dto.setLocationId(event.getLocation() != null ? event.getLocation().getId() : null);
        dto.setEventCategoryId(event.getEventCategory() != null ? event.getEventCategory().getId() : null);
        dto.setAdministratorId(event.getAdministrator() != null ? event.getAdministrator().getId() : null);

        // Imagen embebida
        byte[] img = event.getImageData();
        dto.setImageBase64((img != null && img.length > 0) ? Base64.getEncoder().encodeToString(img) : null);

        dto.setStatus(event.getStatus() != null ? event.getStatus().name() : null);
        dto.setCreatedAt(event.getCreatedAt());
        dto.setUpdatedAt(event.getUpdatedAt());
        return dto;
    }

    // Convierte de DTO → entidad
    public static Event toEntity(EventDTO dto) {
        if (dto == null) return null;

        Event event = new Event();
        event.setId(dto.getId());
        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setStartsAt(dto.getStartsAt());
        event.setSalesStartAt(dto.getSalesStartAt());
        event.setDurationMin(dto.getDurationMin());

        // OJO: aquí solo asignamos objetos "fantasma" con el ID,
        // el service será quien resuelva las entidades reales con repositorios
        if (dto.getLocationId() != null) {
            event.setLocation(new com.digiticket.domain.location.Location());
            event.getLocation().setId(dto.getLocationId());
        }

        if (dto.getEventCategoryId() != null) {
            event.setEventCategory(new com.digiticket.domain.event.EventCategory());
            event.getEventCategory().setId(dto.getEventCategoryId());
        }

        if (dto.getAdministratorId() != null) {
            event.setAdministrator(new com.digiticket.domain.user.Administrator());
            event.getAdministrator().setId(dto.getAdministratorId());
        }

        if (dto.getStatus() != null) {
            event.setStatus(EventStatus.valueOf(dto.getStatus()));
        }

        if (dto.getImageBase64() != null && !dto.getImageBase64().isBlank()) {
            event.setImageData(Base64.getDecoder().decode(dto.getImageBase64()));
        }

        return event;
    }
}
