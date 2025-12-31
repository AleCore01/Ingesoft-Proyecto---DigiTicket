package com.digiticket.controller.event;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventZone;
import com.digiticket.domain.location.LocationZone;
import com.digiticket.dto.event.AvailabilityDTO;
import com.digiticket.dto.event.EventZoneDTO;
import com.digiticket.service.event.AvailabilityService;
import com.digiticket.service.event.EventZoneService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/eventzone")
public class EventZoneController {

    private final EventZoneService eventZoneService;
    private final AvailabilityService availabilityService;

    public EventZoneController(EventZoneService eventZoneService,
                               AvailabilityService availabilityService) {
        this.eventZoneService = eventZoneService;
        this.availabilityService = availabilityService;
    }



    // Crear nueva zona de evento
    @PostMapping("/add")
    public ResponseEntity<Integer> create(@RequestBody EventZoneDTO dto) {
        if (dto.getEventId() == null)
            throw new RuntimeException("Event ID is required");

        Event event = new Event();
        event.setId(dto.getEventId());

        EventZone zone = EventZone.builder()
                .event(event)
                .displayName(dto.getDisplayName())
                .price(dto.getPrice())
                .seatsQuota(dto.getSeatsQuota())
                .seatsSold(dto.getSeatsSold() != null ? dto.getSeatsSold() : 0)
                .status(EventZone.Status.valueOf(dto.getStatus()))
                .build();

        Integer id = eventZoneService.createZone(zone);
        return ResponseEntity.ok(id);
    }

    // Obtener todas las zonas
    @GetMapping("/all")
    public ResponseEntity<List<EventZone>> getAll() {
        List<EventZone> zones = eventZoneService.getAllZones();
        return ResponseEntity.ok(zones);
    }

    // Obtener zona por ID
    @GetMapping("/{id}")
    public ResponseEntity<EventZone> getById(@PathVariable Integer id) {
        EventZone zone = eventZoneService.getZoneById(id);
        if (zone == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(zone);
    }

    // Actualizar zona
    @PutMapping("/update/{id}")
    public ResponseEntity<EventZone> update(@PathVariable Integer id, @RequestBody EventZoneDTO dto) {
        EventZone existing = eventZoneService.getZoneById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (dto.getEventId() != null) {
            Event event = new Event();
            event.setId(dto.getEventId());
            existing.setEvent(event);
        }

        if (dto.getLocationZoneId() != null) {
            LocationZone locationZone = new LocationZone();
            locationZone.setId(dto.getLocationZoneId());
            existing.setLocationZone(locationZone);
        }

        existing.setDisplayName(dto.getDisplayName() != null ? dto.getDisplayName() : existing.getDisplayName());
        existing.setPrice(dto.getPrice() != null ? dto.getPrice() : existing.getPrice());
        existing.setSeatsQuota(dto.getSeatsQuota() != null ? dto.getSeatsQuota() : existing.getSeatsQuota());
        existing.setSeatsSold(dto.getSeatsSold() != null ? dto.getSeatsSold() : existing.getSeatsSold());
        existing.setStatus(dto.getStatus() != null ? EventZone.Status.valueOf(dto.getStatus()) : existing.getStatus());

        return ResponseEntity.ok(eventZoneService.updateZone(id, existing));
    }

    // Eliminar zona
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        eventZoneService.deleteZone(id);
        return ResponseEntity.noContent().build();
    }

    // Listar zonas por evento con disponibilidad real
    @GetMapping("/list/{eventId}")
    public ResponseEntity<List<EventZone>> listByEvent(@PathVariable Integer eventId) {
        List<EventZone> zones = eventZoneService.getZonesByEvent(eventId);
        
        // Enriquecer con disponibilidad real (considerando holds activos)
        List<AvailabilityDTO> availabilities = availabilityService.getAvailabilityByEvent(eventId);
        
        // Mapear disponibilidades por zone ID para acceso rápido
        var availMap = availabilities.stream()
                .collect(java.util.stream.Collectors.toMap(
                        AvailabilityDTO::eventZoneId,
                        avail -> avail
                ));
        
        // Agregar availableNow usando @JsonProperty en EventZone o DTO personalizado
        // Por ahora usamos el campo seatsAvailable que ya existe pero lo recalculamos
        zones.forEach(zone -> {
            AvailabilityDTO avail = availMap.get(zone.getId());
            if (avail != null) {
                // Sobrescribir seatsAvailable con el valor real que incluye holds
                zone.setSeatsAvailable(avail.available());
            }
        });
        
        return ResponseEntity.ok(zones);
    }

    @GetMapping("/available")
    public ResponseEntity<Integer> available( @RequestParam Integer eventId, @RequestParam Integer zoneId) {
        return ResponseEntity.ok(eventZoneService.getAvailable(eventId, zoneId));
    }

    @GetMapping("/{id}/availability")
    public AvailabilityDTO getAvailability(@PathVariable("id") Integer id) {
        return availabilityService.getAvailability(id);
    }
}
