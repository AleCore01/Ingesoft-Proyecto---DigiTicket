package com.digiticket.repository.ticket;

import com.digiticket.domain.ticket.Ticket;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Ticket> findById(Integer id);

    List<Ticket> findAllByOwnerClientIdOrderByCreatedAtDesc(Integer ownerClientId);

    /**
     * Solución simple: cargar solo tickets y purchase, luego acceder a Event
     * de forma controlada SIN inicializar imageData
     */
    @Query("SELECT t FROM Ticket t " +
           "LEFT JOIN FETCH t.purchase " +
           "WHERE t.ownerClientId = :ownerClientId " +
           "ORDER BY t.createdAt DESC")
    List<Ticket> findAllByOwnerClientIdWithDetails(@Param("ownerClientId") Integer ownerClientId);

    /**
     * Cuenta el total de tickets ACTIVOS que posee actualmente un usuario para un evento específico.
     * Esto incluye tickets comprados originalmente y tickets recibidos por transferencia.
     * Solo cuenta tickets con estado ACTIVE (excluye CANCELED y USED).
     */
    @Query(value = "SELECT COUNT(*) " +
                   "FROM ticket t " +
                   "INNER JOIN purchase p ON t.purchase_id = p.id " +
                   "WHERE t.owner_client_id = :ownerClientId " +
                   "AND p.event_id = :eventId " +
                   "AND t.status = 'ACTIVE'", 
           nativeQuery = true)
    Integer countByOwnerAndEvent(
            @Param("ownerClientId") Integer ownerClientId,
            @Param("eventId") Integer eventId
    );

    /**
     * Query ultra-optimizada: obtiene solo los IDs únicos de eventos
     * sin cargar ningún dato pesado (imageData, etc.)
     */
    @Query("SELECT DISTINCT e.id FROM Ticket t JOIN t.purchase p JOIN p.event e WHERE t.ownerClientId = :clientId")
    Set<Integer> findDistinctEventIdsByClientId(@Param("clientId") Integer clientId);
}
