package com.digiticket.service.impl.event;

import com.digiticket.dto.event.AvailabilityDTO;
import com.digiticket.repository.event.EventZoneRepository;
import com.digiticket.repository.event.projection.AvailabilityProjection;
import com.digiticket.service.event.AvailabilityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AvailabilityServiceImpl implements AvailabilityService {

    private final EventZoneRepository eventZoneRepository;

    public AvailabilityServiceImpl(EventZoneRepository eventZoneRepository) {
        this.eventZoneRepository = eventZoneRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AvailabilityDTO getAvailability(Integer eventZoneId) {
        AvailabilityProjection p = eventZoneRepository.findAvailabilityByZoneId(eventZoneId);
        if (p == null) {
            throw new RuntimeException("event_zone not found: " + eventZoneId);
        }
        return new AvailabilityDTO(
                p.getEventZoneId(),
                p.getEventId(),
                p.getSeatsQuota(),
                p.getSeatsSold(),
                p.getHoldsActive(),
                p.getAvailable()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityDTO> getAvailabilityByEvent(Integer eventId) {
        List<AvailabilityProjection> projections = eventZoneRepository.findAvailabilityByEventId(eventId);
        return projections.stream()
                .map(p -> new AvailabilityDTO(
                        p.getEventZoneId(),
                        p.getEventId(),
                        p.getSeatsQuota(),
                        p.getSeatsSold(),
                        p.getHoldsActive(),
                        p.getAvailable()
                ))
                .collect(java.util.stream.Collectors.toList());
    }
}
