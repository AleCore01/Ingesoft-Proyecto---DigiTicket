package com.digiticket.dto.event;

public record AvailabilityDTO(
        Integer eventZoneId,
        Integer eventId,
        int seatsQuota,
        int seatsSold,
        int holdsActive,
        int available
) { }
