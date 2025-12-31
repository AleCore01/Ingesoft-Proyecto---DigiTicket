package com.digiticket.service.impl.dashboard;

import com.digiticket.dto.dashboard.PeriodType;
import com.digiticket.dto.dashboard.RevenueTicketsMetricDTO;
import com.digiticket.repository.dashboard.MetricsRepository;
import com.digiticket.service.dashboard.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MetricsServiceImpl implements MetricsService {

    private final MetricsRepository metricsRepository;

    @Override
    public List<RevenueTicketsMetricDTO> getRevenueAndTickets(PeriodType period, Integer limit) {

        int realLimit = (limit != null) ? limit : 12;

        switch (period) {

            case WEEK:
                return metricsRepository.getWeeklyMetrics()
                        .stream()
                        .map(p -> new RevenueTicketsMetricDTO(
                                p.getLabel(),
                                p.getTicketsSold(),
                                p.getRevenue()
                        ))
                        .toList();

            case MONTH:
                return metricsRepository.getMonthlyMetrics(realLimit)
                        .stream()
                        .map(p -> new RevenueTicketsMetricDTO(
                                p.getLabel(),
                                p.getTicketsSold(),
                                p.getRevenue()
                        ))
                        .toList();

            case YEAR:
                return metricsRepository.getYearlyMetrics(realLimit)
                        .stream()
                        .map(p -> new RevenueTicketsMetricDTO(
                                p.getLabel(),
                                p.getTicketsSold(),
                                p.getRevenue()
                        ))
                        .toList();

            default:
                throw new IllegalArgumentException("Unsupported period " + period);
        }
    }
}
