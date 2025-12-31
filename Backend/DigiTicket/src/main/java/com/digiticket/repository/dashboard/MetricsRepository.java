package com.digiticket.repository.dashboard;

import com.digiticket.domain.order.Purchase;
import com.digiticket.dto.dashboard.RevenueTicketsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MetricsRepository extends JpaRepository<Purchase, Integer> {

    // --- Weekly: igual que antes ---
    @Query(value = """
        SELECT
            CASE DAYOFWEEK(p.created_at)
                WHEN 2 THEN 'Lunes'
                WHEN 3 THEN 'Martes'
                WHEN 4 THEN 'Miércoles'
                WHEN 5 THEN 'Jueves'
                WHEN 6 THEN 'Viernes'
                WHEN 7 THEN 'Sábado'
                WHEN 1 THEN 'Domingo'
            END AS label,
            COUNT(*) AS ticketsSold,
            COALESCE(SUM(p.total_amount), 0) * 1.0 AS revenue
        FROM purchase p
        WHERE p.status = 'ACTIVE'
          AND YEARWEEK(p.created_at, 1) = (
                SELECT YEARWEEK(p2.created_at, 1)
                FROM purchase p2
                WHERE p2.status = 'ACTIVE'
                ORDER BY p2.created_at DESC
                LIMIT 1
          )
        GROUP BY DAYOFWEEK(p.created_at)
        ORDER BY FIELD(DAYOFWEEK(p.created_at), 2,3,4,5,6,7,1)
    """, nativeQuery = true)
    List<RevenueTicketsProjection> getWeeklyMetrics();

    // --- Monthly: últimos 12 meses basados en el último mes con datos ---
    @Query(value = """
        WITH last_month AS (
            SELECT DATE_FORMAT(MAX(p.created_at), '%Y-%m-01') AS max_month
            FROM purchase p
            WHERE p.status = 'ACTIVE'
        ),
        range_start AS (
            SELECT DATE_SUB(max_month, INTERVAL 11 MONTH) AS start_month
            FROM last_month
        )
        SELECT 
            DATE_FORMAT(p.created_at, '%Y-%m') AS label,
            COUNT(*) AS ticketsSold,
            COALESCE(SUM(p.total_amount), 0) AS revenue
        FROM purchase p
        CROSS JOIN last_month lm
        CROSS JOIN range_start rs
        WHERE p.status = 'ACTIVE'
          AND p.created_at >= rs.start_month
          AND p.created_at < DATE_ADD(lm.max_month, INTERVAL 1 MONTH)
        GROUP BY DATE_FORMAT(p.created_at, '%Y-%m')
        ORDER BY label ASC;
    """, nativeQuery = true)
    List<RevenueTicketsProjection> getMonthlyMetrics(int limit);

    // --- Yearly: últimos N años basados en el último año con datos ---
    @Query(value = """
        WITH last_year AS (
            SELECT YEAR(MAX(p.created_at)) AS max_year
            FROM purchase p
            WHERE p.status = 'ACTIVE'
        ),
        range_start AS (
            SELECT max_year - ?1 + 1 AS start_year
            FROM last_year
        )
        SELECT 
            CAST(YEAR(p.created_at) AS CHAR) AS label,
            COUNT(*) AS ticketsSold,
            COALESCE(SUM(p.total_amount), 0) AS revenue
        FROM purchase p
        CROSS JOIN last_year ly
        CROSS JOIN range_start rs
        WHERE p.status = 'ACTIVE'
          AND YEAR(p.created_at) BETWEEN rs.start_year AND ly.max_year
        GROUP BY YEAR(p.created_at)
        ORDER BY label ASC;
    """, nativeQuery = true)
    List<RevenueTicketsProjection> getYearlyMetrics(int limit);
}
