package com.digiticket.repository.order;

import com.digiticket.domain.order.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;

public interface PurchaseRepository extends JpaRepository<Purchase, Integer> {

    Page<Purchase> findByClientIdOrderByCreatedAtDesc(Integer clientId, Pageable pageable);

    @Query(value = "SELECT COALESCE(SUM(p.total_amount), 0) " +
            "FROM purchase p " +
            "WHERE p.created_at >= :start " +
            "AND p.created_at < :end " +
            "AND p.status = 'ACTIVE'",
            nativeQuery = true)
    BigDecimal sumTotalAmountByDateRangeAndActiveStatus(
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query(value = "SELECT COALESCE(SUM(p.total_quantity), 0) " +
            "FROM purchase p " +
            "WHERE p.created_at >= :start " +
            "AND p.created_at < :end " +
            "AND p.status = 'ACTIVE'",
            nativeQuery = true)
    Integer sumTotalQuantityByDateRangeAndActiveStatus(
            @Param("start") Instant start,
            @Param("end") Instant end
    );

}
