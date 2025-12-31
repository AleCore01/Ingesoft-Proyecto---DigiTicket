package com.digiticket.service.impl.report;

import com.digiticket.dto.dashboard.RevenueTicketsMetricDTO;
import com.digiticket.dto.dashboard.RevenueTicketsProjection;
import com.digiticket.dto.dashboard.TopCategoryDTO;
import com.digiticket.dto.dashboard.TopEventDTO;
import com.digiticket.dto.report.DashboardReportDTO;
import com.digiticket.dto.report.DailySalesMetricsDTO;
import com.digiticket.repository.auditlog.AuditLogRepository;
import com.digiticket.repository.dashboard.CategoryMetricsRepository;
import com.digiticket.repository.dashboard.EventMetricsRepository;
import com.digiticket.repository.dashboard.MetricsRepository;
import com.digiticket.repository.order.PurchaseRepository;
import com.digiticket.service.report.DailySalesMetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DailySalesMetricsServiceImpl implements DailySalesMetricsService {

    private final PurchaseRepository purchaseRepository;
    private final AuditLogRepository auditLogRepository;
    private final CategoryMetricsRepository categoryMetricsRepository;
    private final EventMetricsRepository eventMetricsRepository;
    private final MetricsRepository metricsRepository;

    @Override
    public DashboardReportDTO getDashboardReport(String period) {

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        LocalDateTime startToday = today.atStartOfDay();
        LocalDateTime endToday = today.atTime(23, 59, 59);
        LocalDateTime startYesterday = yesterday.atStartOfDay();
        LocalDateTime endYesterday = yesterday.atTime(23, 59, 59);

        // --- Daily Sales ---
        Long ticketsToday = purchaseRepository.sumTotalQuantityByDateRangeAndActiveStatus(
                startToday.toInstant(java.time.ZoneOffset.UTC),
                endToday.toInstant(java.time.ZoneOffset.UTC)
        ).longValue();

        Long ticketsYesterday = purchaseRepository.sumTotalQuantityByDateRangeAndActiveStatus(
                startYesterday.toInstant(java.time.ZoneOffset.UTC),
                endYesterday.toInstant(java.time.ZoneOffset.UTC)
        ).longValue();

        BigDecimal revenueToday = purchaseRepository.sumTotalAmountByDateRangeAndActiveStatus(
                startToday.toInstant(java.time.ZoneOffset.UTC),
                endToday.toInstant(java.time.ZoneOffset.UTC)
        );

        BigDecimal revenueYesterday = purchaseRepository.sumTotalAmountByDateRangeAndActiveStatus(
                startYesterday.toInstant(java.time.ZoneOffset.UTC),
                endYesterday.toInstant(java.time.ZoneOffset.UTC)
        );

        Integer visitsToday = auditLogRepository.countLoginsByDateRange(
                startToday.toInstant(java.time.ZoneOffset.UTC),
                endToday.toInstant(java.time.ZoneOffset.UTC)
        );

        Integer visitsYesterday = auditLogRepository.countLoginsByDateRange(
                startYesterday.toInstant(java.time.ZoneOffset.UTC),
                endYesterday.toInstant(java.time.ZoneOffset.UTC)
        );

        double ticketsVariation = ticketsYesterday != 0
                ? ((ticketsToday.doubleValue() - ticketsYesterday.doubleValue()) / ticketsYesterday) * 100
                : 100.0;

        double revenueVariation = revenueYesterday != null && revenueYesterday.compareTo(BigDecimal.ZERO) != 0
                ? (revenueToday.subtract(revenueYesterday)
                .divide(revenueYesterday, 4, BigDecimal.ROUND_HALF_UP)
                .doubleValue()) * 100
                : 100.0;

        double visitsVariation = visitsYesterday != 0
                ? ((visitsToday.doubleValue() - visitsYesterday.doubleValue()) / visitsYesterday) * 100
                : 100.0;

        DailySalesMetricsDTO dailySales = new DailySalesMetricsDTO(
                ticketsToday,
                revenueToday,
                (long) visitsToday,
                ticketsVariation,
                revenueVariation,
                visitsVariation
        );

        // --- Top Categories ---
        LocalDateTime startMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endMonth = today.withDayOfMonth(today.lengthOfMonth()).atTime(23, 59, 59);
        List<TopCategoryDTO> topCategories = categoryMetricsRepository.findTopCategoriesOfCurrentMonth(
                startMonth, endMonth
        );

        // --- Top Events ---
        List<TopEventDTO> topEvents = eventMetricsRepository.findTopEventsBetween(
                startMonth, endMonth, PageRequest.of(0, 5)
        );

        // --- Revenue Metrics ---
        List<RevenueTicketsProjection> projectionList;
        switch (period.toUpperCase()) {
            case "WEEK":
                projectionList = metricsRepository.getWeeklyMetrics();
                break;
            case "MONTH":
                projectionList = metricsRepository.getMonthlyMetrics(12);
                break;
            case "YEAR":
                projectionList = metricsRepository.getYearlyMetrics(5);
                break;
            default:
                projectionList = metricsRepository.getWeeklyMetrics();
        }

// Mapear de RevenueTicketsProjection -> RevenueTicketsMetricDTO
        List<RevenueTicketsMetricDTO> revenueMetrics = projectionList.stream()
                .map(p -> new RevenueTicketsMetricDTO(
                        p.getLabel(),
                        p.getTicketsSold().longValue(),
                        p.getRevenue()
                ))
                .toList();


        return new DashboardReportDTO(dailySales, topCategories, topEvents, revenueMetrics);

    }
}
