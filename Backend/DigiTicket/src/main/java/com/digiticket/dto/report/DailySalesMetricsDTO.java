package com.digiticket.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class DailySalesMetricsDTO {
    private Long ticketsSoldToday;
    private BigDecimal revenueToday;
    private Long totalVisitsToday;

    private Double ticketsVariationPercent;
    private Double revenueVariationPercent;
    private Double visitsVariationPercent;
}
