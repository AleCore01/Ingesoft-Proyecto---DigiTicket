package com.digiticket.repository.dashboard;

import com.digiticket.domain.order.Purchase;
import com.digiticket.dto.dashboard.TopCategoryDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CategoryMetricsRepository extends JpaRepository<Purchase, Long> {

    @Query("""
        SELECT new com.digiticket.dto.dashboard.TopCategoryDTO(
            c.name,
            SUM(p.totalQuantity),
            SUM(p.totalAmount)
        )
        FROM Purchase p
        JOIN p.event e
        JOIN e.eventCategory c
        WHERE p.createdAt BETWEEN :startDate AND :endDate
        GROUP BY c.name
        ORDER BY SUM(p.totalQuantity) DESC
        """)
    List<TopCategoryDTO> findTopCategoriesOfCurrentMonth(
            LocalDateTime startDate,
            LocalDateTime endDate
    );

}
