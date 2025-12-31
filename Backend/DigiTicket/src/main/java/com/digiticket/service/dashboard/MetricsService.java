package com.digiticket.service.dashboard;

import com.digiticket.dto.dashboard.PeriodType;
import com.digiticket.dto.dashboard.RevenueTicketsMetricDTO;

import java.util.List;

public interface MetricsService {
    List<RevenueTicketsMetricDTO> getRevenueAndTickets(PeriodType period, Integer limit);
}
