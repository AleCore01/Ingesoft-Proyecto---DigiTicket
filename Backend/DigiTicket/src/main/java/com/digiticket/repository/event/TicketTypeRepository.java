package com.digiticket.repository.event;

import com.digiticket.domain.event.TicketType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketTypeRepository extends JpaRepository<TicketType, Integer> {
    
    /**
     * Encuentra todos los tipos de ticket para un evento específico
     */
    List<TicketType> findByEventId(Integer eventId);
    
    /**
     * Encuentra todos los tipos de ticket para un evento específico ordenados por precio
     */
    List<TicketType> findByEventIdOrderByPriceAsc(Integer eventId);
    
    /**
     * Calcula el stock disponible de un tipo de ticket
     * Stock disponible = stock físico - suma de holds vigentes
     * 
     * NOTA: Esta query está preparada para cuando se implemente la tabla reservation_hold.
     * Por ahora retorna el stock físico directamente.
     */
    @Query("""
        SELECT tt.stock
        FROM TicketType tt
        WHERE tt.id = :ticketTypeId
        """)
    Integer getAvailableStock(@Param("ticketTypeId") Integer ticketTypeId);
    
    /**
     * Calcula el stock disponible considerando holds vigentes (para implementación futura)
     * 
     * Cuando se implemente reservation_hold, usar esta query:
     * 
     * SELECT tt.stock - COALESCE(SUM(rh.quantity), 0)
     * FROM TicketType tt
     * LEFT JOIN ReservationHold rh ON rh.ticketTypeId = tt.id
     *     AND rh.status = 'PENDING'
     *     AND rh.expiresAt > CURRENT_TIMESTAMP
     * WHERE tt.id = :ticketTypeId
     * GROUP BY tt.id, tt.stock
     */
}
