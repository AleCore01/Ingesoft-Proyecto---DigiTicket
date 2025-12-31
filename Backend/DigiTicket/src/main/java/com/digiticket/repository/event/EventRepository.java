package com.digiticket.repository.event;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Integer>, JpaSpecificationExecutor<Event> {
    List<Event> findByStatus(EventStatus status);
    List<Event> findByTitleContainingIgnoreCase(String q);
    List<Event> findByStartsAtBetween(LocalDateTime from, LocalDateTime to);
    List<Event> findByLocationId(Integer locationId);
    List<Event> findByLocationIdAndStartsAtBetween(Integer locationId, LocalDateTime start, LocalDateTime end);
//    boolean existsByTitleAndStartsAtAndLocation_Id(String title, LocalDateTime startsAt, Integer locationId);

    //Para consultas para location
    boolean existsByLocation_Id_AndStatusIn(Integer locationId, List<EventStatus> statuses);
    int countByLocation_Id(Integer locationId);

    /**
     * Carga solo los campos necesarios de eventos específicos (id + imageData)
     * sin traer relaciones innecesarias
     */
    @org.springframework.data.jpa.repository.Query("SELECT e FROM Event e WHERE e.id IN :eventIds")
    List<Event> findByIdIn(@org.springframework.data.repository.query.Param("eventIds") java.util.Set<Integer> eventIds);
    
    /**
     * Proyección ligera: carga eventos SIN imageData para mejor performance
     */
    @org.springframework.data.jpa.repository.Query(
        "SELECT e.id as id, e.title as title, e.startsAt as startsAt, " +
        "l.id as locationId, l.name as locationName, l.address as locationAddress " +
        "FROM Event e LEFT JOIN e.location l " +
        "WHERE e.id IN :eventIds"
    )
    List<com.digiticket.dto.event.EventBasicProjection> findBasicInfoByIds(
        @org.springframework.data.repository.query.Param("eventIds") java.util.Set<Integer> eventIds
    );
}
