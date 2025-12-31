package com.digiticket.service.impl.dashboard;

import com.digiticket.dto.dashboard.DailySalesDTO;
import com.digiticket.dto.dashboard.DailyTicketsDTO;
import com.digiticket.dto.dashboard.DailyVisitsDTO;
import com.digiticket.repository.auditlog.AuditLogRepository;
import com.digiticket.repository.order.PurchaseRepository;
import com.digiticket.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final PurchaseRepository purchaseRepository;
    private final AuditLogRepository auditLogRepository; // ✅ FALTABA ESTO

    @Override
    public DailySalesDTO getTodaySales() {

        ZoneId zone = ZoneId.of("America/Lima");

        // HOY
        Instant startToday = LocalDate.now(zone)
                .atStartOfDay(zone)
                .toInstant();

        Instant endToday = LocalDate.now(zone)
                .plusDays(1)
                .atStartOfDay(zone)
                .toInstant();

        // AYER
        Instant startYesterday = LocalDate.now(zone)
                .minusDays(1)
                .atStartOfDay(zone)
                .toInstant();

        Instant endYesterday = LocalDate.now(zone)
                .atStartOfDay(zone)
                .toInstant();

        BigDecimal totalToday = purchaseRepository.sumTotalAmountByDateRangeAndActiveStatus(
                startToday, endToday
        );

        BigDecimal totalYesterday = purchaseRepository.sumTotalAmountByDateRangeAndActiveStatus(
                startYesterday, endYesterday
        );

        if (totalToday == null) totalToday = BigDecimal.ZERO;
        if (totalYesterday == null) totalYesterday = BigDecimal.ZERO;

        BigDecimal variation;

        if (totalYesterday.compareTo(BigDecimal.ZERO) == 0) {
            variation = totalToday.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : BigDecimal.valueOf(100);
        } else {
            variation = totalToday
                    .subtract(totalYesterday)
                    .divide(totalYesterday, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        return new DailySalesDTO(
                totalToday,
                variation.setScale(2, RoundingMode.HALF_UP)
        );
    }

    @Override
    public DailyTicketsDTO getTodayTickets() {

        ZoneId zone = ZoneId.of("America/Lima");

        Instant startToday = LocalDate.now(zone).atStartOfDay(zone).toInstant();
        Instant endToday = LocalDate.now(zone).plusDays(1).atStartOfDay(zone).toInstant();
        Instant startYesterday = LocalDate.now(zone).minusDays(1).atStartOfDay(zone).toInstant();
        Instant endYesterday = LocalDate.now(zone).atStartOfDay(zone).toInstant();

        Integer today = purchaseRepository.sumTotalQuantityByDateRangeAndActiveStatus(
                startToday, endToday);

        Integer yesterday = purchaseRepository.sumTotalQuantityByDateRangeAndActiveStatus(
                startYesterday, endYesterday);

        if (today == null) today = 0;
        if (yesterday == null) yesterday = 0;

        Integer difference = today - yesterday;

        return new DailyTicketsDTO(today, difference);
    }

    @Override
    public DailyVisitsDTO getTodayVisits() {

        ZoneId zone = ZoneId.of("America/Lima");

        Instant startToday = LocalDate.now(zone).atStartOfDay(zone).toInstant();
        Instant endToday = LocalDate.now(zone).plusDays(1).atStartOfDay(zone).toInstant();

        Instant startYesterday = LocalDate.now(zone).minusDays(1).atStartOfDay(zone).toInstant();
        Instant endYesterday = LocalDate.now(zone).atStartOfDay(zone).toInstant();

        // ✅ CORREGIDO: se llama a la instancia del repo, no a la clase
        Integer today = auditLogRepository.countLoginsByDateRange(startToday, endToday);
        Integer yesterday = auditLogRepository.countLoginsByDateRange(startYesterday, endYesterday);

        if (today == null) today = 0;
        if (yesterday == null) yesterday = 0;

        double variation;

        if (yesterday == 0) {
            variation = today == 0 ? 0 : 100;
        } else {
            variation = ((today - yesterday) / (double) yesterday) * 100.0;
        }

        return new DailyVisitsDTO(
                today,
                Math.round(variation * 100.0) / 100.0
        );
    }
}
