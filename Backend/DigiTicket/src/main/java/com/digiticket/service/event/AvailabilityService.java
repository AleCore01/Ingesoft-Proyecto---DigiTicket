package com.digiticket.service.event;

import com.digiticket.dto.event.AvailabilityDTO;
import java.util.List;

public interface AvailabilityService {
    AvailabilityDTO getAvailability(Integer eventZoneId);
    List<AvailabilityDTO> getAvailabilityByEvent(Integer eventId);
}
