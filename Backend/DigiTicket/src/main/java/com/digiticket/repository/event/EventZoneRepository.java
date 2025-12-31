package com.digiticket.repository.event;

import com.digiticket.domain.event.EventZone;
import com.digiticket.repository.event.projection.AvailabilityProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EventZoneRepository extends JpaRepository<EventZone, Integer> {
    List<EventZone> findByEvent_Id(Integer eventId);
    //long deleteByEvent_Id(Integer eventId);
    Optional<EventZone> findFirstByEvent_IdAndLocationZone_Id(Integer eventId, Integer zoneId);

    @Query(value = """
    SELECT
      event_zone_id AS eventZoneId,
      event_id      AS eventId,
      seats_quota   AS seatsQuota,
      seats_sold    AS seatsSold,
      holds_active  AS holdsActive,
      available     AS available
    FROM vw_event_zone_availability
    WHERE event_zone_id = :zoneId
    """, nativeQuery = true)
    AvailabilityProjection findAvailabilityByZoneId(
            @Param("zoneId") Integer zoneId
    );

    @Query(value = """
    SELECT
      event_zone_id AS eventZoneId,
      event_id      AS eventId,
      seats_quota   AS seatsQuota,
      seats_sold    AS seatsSold,
      holds_active  AS holdsActive,
      available     AS available
    FROM vw_event_zone_availability
    WHERE event_id = :eventId
    """, nativeQuery = true)
    List<AvailabilityProjection> findAvailabilityByEventId(
            @Param("eventId") Integer eventId
    );
}
