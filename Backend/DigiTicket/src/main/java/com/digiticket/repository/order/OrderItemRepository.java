package com.digiticket.repository.order;

import com.digiticket.domain.order.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import com.digiticket.domain.order.OrderItem;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem,Integer> {

    /**
     * Cuenta el total de tickets comprados por un usuario para un evento específico
     * considerando solo órdenes PAID.
     */
    @Query("SELECT COALESCE(SUM(oi.qty), 0) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.userId = :userId " +
           "AND oi.eventId = :eventId " +
           "AND oi.order.status = :status")
    Integer sumTicketsByUserAndEventAndStatus(
            @Param("userId") Integer userId,
            @Param("eventId") Integer eventId,
            @Param("status") OrderStatus status
    );
}
