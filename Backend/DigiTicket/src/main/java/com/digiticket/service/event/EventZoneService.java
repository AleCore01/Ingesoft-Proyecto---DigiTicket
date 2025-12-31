package com.digiticket.service.event;

import com.digiticket.domain.event.EventZone;

import java.util.List;

public interface EventZoneService {
    Integer createZone(EventZone zone);
    EventZone updateZone(Integer id, EventZone updated);
    void deleteZone(Integer id);
    EventZone getZoneById(Integer id);
    List<EventZone> getZonesByEvent(Integer eventId);
    List<EventZone> getAllZones();
    Integer getAvailable(Integer eventId, Integer zoneId);
}
