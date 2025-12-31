package com.digiticket.repository.dashboard;

import com.digiticket.domain.order.Purchase;
import com.digiticket.dto.dashboard.TopEventDTO;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EventMetricsRepository extends JpaRepository<Purchase, Long> {

    @Query("""
        SELECT new com.digiticket.dto.dashboard.TopEventDTO(
               e.title,
               SUM(p.totalQuantity),
               SUM(p.totalAmount)
        )
        FROM Purchase p
        JOIN p.event e
        WHERE p.createdAt BETWEEN :startDate AND :endDate
        GROUP BY e.title
        ORDER BY SUM(p.totalQuantity) DESC
        """)
    List<TopEventDTO> findTopEventsBetween(
            @Param("startDate") LocalDateTime start,
            @Param("endDate") LocalDateTime end,
            Pageable pageable
    );

}
