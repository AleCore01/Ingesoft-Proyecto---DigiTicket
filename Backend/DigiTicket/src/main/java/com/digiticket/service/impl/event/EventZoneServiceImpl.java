package com.digiticket.service.impl.event;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventZone;
import com.digiticket.domain.location.LocationZone;
import com.digiticket.repository.event.EventRepository;
import com.digiticket.repository.event.EventZoneRepository;
import com.digiticket.repository.location.LocationZoneRepository;
import com.digiticket.service.event.EventZoneService;
import org.springframework.stereotype.Service;
import com.digiticket.repository.location.LocationRepository;

import java.util.List;
import java.util.Optional;
@Service
public class EventZoneServiceImpl implements EventZoneService {

    private final EventZoneRepository eventZoneRepository;
    private final EventRepository eventRepository;
    private final LocationZoneRepository locationZoneRepository;
    private final LocationRepository locationRepository;

    public EventZoneServiceImpl(EventZoneRepository eventZoneRepository,
                                EventRepository eventRepository,
                                LocationZoneRepository locationZoneRepository,
                                LocationRepository locationRepository) {
        this.eventZoneRepository = eventZoneRepository;
        this.eventRepository = eventRepository;
        this.locationZoneRepository = locationZoneRepository;
        this.locationRepository = locationRepository;
    }

    @Override
    public Integer createZone(EventZone zone) {
        if (zone.getEvent() == null || zone.getEvent().getId() == null)
            throw new RuntimeException("Event is required (event_id)");

        // Obtener el evento real
        Event event = eventRepository.findById(zone.getEvent().getId())
                .orElseThrow(() -> new RuntimeException("Event not found with id " + zone.getEvent().getId()));

        // Crear nueva location_zone automáticamente si no hay id
        LocationZone locationZone = new LocationZone();
        locationZone.setName(zone.getDisplayName() != null ? zone.getDisplayName() : "Zona");
        locationZone.setCapacity(zone.getSeatsQuota() != null ? zone.getSeatsQuota() : 0);
        locationZone.setLocation(event.getLocation()); // usa el local del evento

        locationZone = locationZoneRepository.save(locationZone);

        // Asignar relaciones
        zone.setEvent(event);
        zone.setLocationZone(locationZone);

        if (zone.getSeatsSold() == null) zone.setSeatsSold(0);
        if (zone.getStatus() == null) zone.setStatus(EventZone.Status.ACTIVE);

        EventZone saved = eventZoneRepository.save(zone);
        return saved.getId();
    }



    @Override
    public EventZone updateZone(Integer id, EventZone updated) {
        Optional<EventZone> opt = eventZoneRepository.findById(id);
        if (opt.isEmpty()) {
            throw new RuntimeException("EventZone not found with id " + id);
        }
        EventZone existing = opt.get();

        existing.setDisplayName(updated.getDisplayName());
        if (updated.getPrice() != null) existing.setPrice(updated.getPrice());
        if (updated.getSeatsQuota() != null) existing.setSeatsQuota(updated.getSeatsQuota());
        if (updated.getSeatsSold() != null) {
            if (existing.getSeatsQuota() != null && updated.getSeatsSold() > existing.getSeatsQuota()) {
                throw new RuntimeException("seatsSold cannot be greater than seatsQuota");
            }
            existing.setSeatsSold(updated.getSeatsSold());
        }
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());

        // Manejo de claves foráneas actualizadas
        if (updated.getEvent() != null && updated.getEvent().getId() != null) {
            Event event = eventRepository.findById(updated.getEvent().getId())
                    .orElseThrow(() -> new RuntimeException("Event not found with id " + updated.getEvent().getId()));
            existing.setEvent(event);
        }

        if (updated.getLocationZone() != null && updated.getLocationZone().getId() != null) {
            LocationZone locationZone = locationZoneRepository.findById(updated.getLocationZone().getId())
                    .orElseThrow(() -> new RuntimeException("LocationZone not found with id " + updated.getLocationZone().getId()));
            existing.setLocationZone(locationZone);
        }

        return eventZoneRepository.save(existing);
    }

    @Override
    public void deleteZone(Integer id) {
        if (!eventZoneRepository.existsById(id)) {
            throw new RuntimeException("EventZone not found with id " + id);
        }
        eventZoneRepository.deleteById(id);
    }

    @Override
    public EventZone getZoneById(Integer id) {
        return eventZoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("EventZone not found with id " + id));
    }

    @Override
    public List<EventZone> getZonesByEvent(Integer eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id " + eventId));
        return eventZoneRepository.findByEvent_Id(eventId);
    }

    @Override
    public Integer getAvailable(Integer eventId, Integer zoneId) {
        return eventZoneRepository
                .findFirstByEvent_IdAndLocationZone_Id(eventId, zoneId)
                .map(z -> {
                    Integer sa = z.getSeatsAvailable();
                    if (sa != null) return sa;
                    // Fallback por si seats_available viniera null
                    int quota = z.getSeatsQuota() != null ? z.getSeatsQuota() : 0;
                    int sold  = z.getSeatsSold()  != null ? z.getSeatsSold()  : 0;
                    return Math.max(quota - sold, 0);
                })
                .orElse(0);
    }

    @Override
    public List<EventZone> getAllZones() {
        return eventZoneRepository.findAll();
    }
}