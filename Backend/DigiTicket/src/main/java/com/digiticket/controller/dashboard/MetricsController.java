package com.digiticket.controller.dashboard;

import com.digiticket.dto.dashboard.PeriodType;
import com.digiticket.dto.dashboard.RevenueTicketsMetricDTO;
import com.digiticket.service.dashboard.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsService metricsService;

    @GetMapping("/revenue-and-tickets")
    public ResponseEntity<List<RevenueTicketsMetricDTO>> getRevenueAndTickets(
            @RequestParam(required = false, defaultValue = "MONTH") PeriodType period,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(metricsService.getRevenueAndTickets(period, limit));
    }
}
