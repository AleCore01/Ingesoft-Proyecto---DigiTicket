package com.digiticket.service.impl.event;

//import com.digiticket.domain.*;
import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventCategory;
import com.digiticket.domain.event.EventStatus;
import com.digiticket.domain.location.Location;
import com.digiticket.domain.user.Administrator;
import com.digiticket.repository.event.EventCategoryRepository;
import com.digiticket.repository.event.EventRepository;
import com.digiticket.repository.location.LocationRepository;
import com.digiticket.repository.order.OrderItemRepository;
import com.digiticket.repository.order.OrderRepository;
import com.digiticket.repository.user.AdministratorRepository;
import com.digiticket.service.event.EventService;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.criteria.Predicate;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final LocationRepository locationRepository;
    private final EventCategoryRepository eventCategoryRepository;
    private final AdministratorRepository administratorRepository;

    // 🔥 AGREGADO PARA HISTORIAL
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public EventServiceImpl(EventRepository eventRepository,
                            LocationRepository locationRepository,
                            EventCategoryRepository eventCategoryRepository,
                            AdministratorRepository administratorRepository,
                            OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository) {

        this.eventRepository = eventRepository;
        this.locationRepository = locationRepository;
        this.eventCategoryRepository = eventCategoryRepository;
        this.administratorRepository = administratorRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Override
    public Event createEvent(Event event) {
        validateForeignKeys(event);
        if (event.getStatus() == null) {
            event.setStatus(EventStatus.DRAFT);
        }

        if (event.getSalesStartAt() == null) {
            event.setSalesStartAt(event.getStartsAt() != null ? event.getStartsAt() : LocalDateTime.now());
        }

        return eventRepository.save(event);
    }

    @Override
    public Event updateEvent(Integer id, Event updated) {
        Optional<Event> optional = eventRepository.findById(id);
        if (optional.isEmpty()) {
            throw new RuntimeException("Event not found with id " + id);
        }
        Event existing = optional.get();

        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setStartsAt(updated.getStartsAt());

        if (updated.getSalesStartAt() != null) {
            existing.setSalesStartAt(updated.getSalesStartAt());
        }

        existing.setDurationMin(updated.getDurationMin());

        if (updated.getLocation() != null && updated.getLocation().getId() != null) {
            existing.setLocation(findLocationOrThrow(updated.getLocation().getId()));
        }

        if (updated.getEventCategory() != null && updated.getEventCategory().getId() != null) {
            existing.setEventCategory(findCategoryOrThrow(updated.getEventCategory().getId()));
        }

        if (updated.getAdministrator() != null && updated.getAdministrator().getId() != null) {
            existing.setAdministrator(findAdminOrThrow(updated.getAdministrator().getId()));
        }

        if (updated.getStatus() != null) {
            existing.setStatus(updated.getStatus());
        }

        if (updated.getImageData() != null && updated.getImageData().length > 0) {
            existing.setImageData(updated.getImageData());
        }

        return eventRepository.save(existing);
    }

    @Override
    public void deleteEvent(Integer id) {
        if (!eventRepository.existsById(id)) {
            throw new RuntimeException("Event not found with id " + id);
        }
        eventRepository.deleteById(id);
    }

    @Override
    public Event getEventById(Integer id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id " + id));
    }

    @Override
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @Override
    public Event publishEvent(Integer id) {
        Event e = getEventById(id);
        e.setStatus(EventStatus.PUBLISHED);
        return eventRepository.save(e);
    }

    @Override
    public Event cancelEvent(Integer id) {
        Event e = getEventById(id);
        e.setStatus(EventStatus.CANCELED);
        return eventRepository.save(e);
    }

    @Override
    public Event finishEvent(Integer id) {
        Event e = getEventById(id);
        e.setStatus(EventStatus.FINISHED);
        return eventRepository.save(e);
    }

    private void validateForeignKeys(Event e) {
        if (e.getLocation() == null || e.getLocation().getId() == null) {
            throw new RuntimeException("Location is required (location_id)");
        }
        if (e.getEventCategory() == null || e.getEventCategory().getId() == null) {
            throw new RuntimeException("Event category is required (event_category_id)");
        }
        if (e.getAdministrator() == null || e.getAdministrator().getId() == null) {
            throw new RuntimeException("Administrator is required (administrator_id)");
        }

        findLocationOrThrow(e.getLocation().getId());
        findCategoryOrThrow(e.getEventCategory().getId());
        findAdminOrThrow(e.getAdministrator().getId());
    }

    private Location findLocationOrThrow(Integer id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with id " + id));
    }

    private EventCategory findCategoryOrThrow(Integer id) {
        return eventCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("EventCategory not found with id " + id));
    }

    private Administrator findAdminOrThrow(Integer id) {
        return administratorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Administrator not found with id " + id));
    }

    @Override
    public List<Event> searchEvents(String title, EventStatus status, Integer locationId,
                                    LocalDateTime from, LocalDateTime to) {

        Specification<Event> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (title != null && !title.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (locationId != null) {
                predicates.add(cb.equal(root.get("location").get("id"), locationId));
            }

            if (from != null && to != null) {
                predicates.add(cb.between(root.get("startsAt"), from, to));
            } else if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startsAt"), from));
            } else if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startsAt"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return eventRepository.findAll(spec);
    }


}
