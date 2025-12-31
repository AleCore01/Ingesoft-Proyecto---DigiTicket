package com.digiticket.service.event;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface EventService {

    Event createEvent(Event event);
    Event updateEvent(Integer id, Event updated);
    void deleteEvent(Integer id);
    Event getEventById(Integer id);
    List<Event> getAllEvents();
    // Acciones de estado
    Event publishEvent(Integer id);
    Event cancelEvent(Integer id);
    Event finishEvent(Integer id);
    List<Event> searchEvents(String title, EventStatus status, Integer locationId,
                             LocalDateTime from, LocalDateTime to);
}
