package com.digiticket.repository.event.projection;

public interface AvailabilityProjection {
    Integer getEventZoneId();
    Integer getEventId();
    Integer getSeatsQuota();
    Integer getSeatsSold();
    Integer getHoldsActive();
    Integer getAvailable();
}
