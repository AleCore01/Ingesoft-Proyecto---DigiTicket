package com.digiticket.repository.reservation;

import com.digiticket.domain.reservation.ReservationHold;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationHoldRepository extends JpaRepository<ReservationHold, Integer> {

    /**
     * Suma de asientos retenidos (PENDING) y aún vigentes para una zona.
     * Sirve para calcular disponibilidad real: seats_quota - seats_sold - (este SUM).
     */
    @Query("""
        SELECT COALESCE(SUM(rh.qty), 0)
        FROM ReservationHold rh
        WHERE rh.eventZoneId = :zoneId
          AND rh.status = com.digiticket.domain.reservation.ReservationStatus.PENDING
          AND rh.expiresAt > :now
        """)
    int sumPendingActiveQtyByZone(@Param("zoneId") Integer eventZoneId,
                                  @Param("now") LocalDateTime now);

    /**
     * Primer WAITING (FIFO) por zona — se usa para promover a PENDING cuando sube la disponibilidad.
     * Lo ordenamos por createdAt asc (si prefieres por 'position', cambia el ORDER BY).
     */
    @Query("""
        SELECT rh
        FROM ReservationHold rh
        WHERE rh.eventZoneId = :zoneId
          AND rh.status = com.digiticket.domain.reservation.ReservationStatus.WAITING
        ORDER BY rh.createdAt ASC
        """)
    List<ReservationHold> findWaitingFIFOByZone(@Param("zoneId") Integer eventZoneId);

    /**
     * Expira en lote todos los PENDING cuyo expires_at ya pasó.
     * Útil para el scheduler (cada 1 min).
     */
    @Modifying
    @Query("""
        UPDATE ReservationHold rh
        SET rh.status = com.digiticket.domain.reservation.ReservationStatus.EXPIRED
        WHERE rh.status = com.digiticket.domain.reservation.ReservationStatus.PENDING
          AND rh.expiresAt <= :now
        """)
    int expireDuePending(@Param("now") LocalDateTime now);

    /**
     * Busca un hold por cartItem (útil para diagnosis o limpieza si borran ítems del carrito).
     */
    Optional<ReservationHold> findFirstByCartItemId(Long cartItemId);

    /**
     * Busca todos los holds activos (PENDING no vencidos) del usuario para una zona (útil para evitar duplicados).
     */
    @Query("""
        SELECT rh
        FROM ReservationHold rh
        WHERE rh.userId = :userId
          AND rh.eventZoneId = :zoneId
          AND rh.status = com.digiticket.domain.reservation.ReservationStatus.PENDING
          AND rh.expiresAt > :now
        """)
    List<ReservationHold> findActivePendingByUserAndZone(@Param("userId") Integer userId,
                                                         @Param("zoneId") Integer eventZoneId,
                                                         @Param("now") LocalDateTime now);

    /**
     * Busca todos los holds PENDING o WAITING del usuario que corresponden a una lista de cart_item_id.
     * Sirve para expirarlos antes de crear nuevos holds (placeHold idempotente).
     */
    @Query("""
        SELECT rh
        FROM ReservationHold rh
        WHERE rh.userId = :userId
          AND rh.cartItemId IN :cartItemIds
          AND rh.status IN (com.digiticket.domain.reservation.ReservationStatus.PENDING,
                            com.digiticket.domain.reservation.ReservationStatus.WAITING)
        """)
    List<ReservationHold> findByUserAndCartItemIds(@Param("userId") Integer userId,
                                                    @Param("cartItemIds") List<Long> cartItemIds);

    /**
     * Expira en lote los holds de una lista de IDs (cambio de estado PENDING/WAITING → EXPIRED).
     * Útil para limpiar holds antiguos antes de crear nuevos.
     */
    @Modifying
    @Query("""
        UPDATE ReservationHold rh
        SET rh.status = com.digiticket.domain.reservation.ReservationStatus.EXPIRED
        WHERE rh.id IN :ids
          AND rh.status IN (com.digiticket.domain.reservation.ReservationStatus.PENDING,
                            com.digiticket.domain.reservation.ReservationStatus.WAITING)
        """)
    int expireByIds(@Param("ids") List<Integer> ids);
}
