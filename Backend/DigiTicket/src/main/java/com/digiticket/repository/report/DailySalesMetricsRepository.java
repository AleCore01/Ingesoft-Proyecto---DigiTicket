package com.digiticket.repository.report;

import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface DailySalesMetricsRepository {

    @Query("SELECT COALESCE(SUM(p.totalQuantity), 0) FROM Purchase p WHERE p.createdAt BETWEEN :start AND :end")
    Long getTotalTicketsSold(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Purchase p WHERE p.createdAt BETWEEN :start AND :end")
    BigDecimal getTotalRevenue(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.action = 'LOGIN' AND a.createdAt BETWEEN :start AND :end")
    Long getTotalVisits(LocalDateTime start, LocalDateTime end);
}
