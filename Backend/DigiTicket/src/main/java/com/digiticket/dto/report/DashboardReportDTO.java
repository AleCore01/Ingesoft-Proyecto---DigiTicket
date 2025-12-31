package com.digiticket.dto.report;

import com.digiticket.dto.dashboard.RevenueTicketsMetricDTO;
import com.digiticket.dto.dashboard.TopCategoryDTO;
import com.digiticket.dto.dashboard.TopEventDTO;
import com.digiticket.dto.report.DailySalesMetricsDTO;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class DashboardReportDTO {
    private DailySalesMetricsDTO dailySales;
    private List<TopCategoryDTO> topCategories;
    private List<TopEventDTO> topEvents;
    private List<RevenueTicketsMetricDTO> revenueMetrics;
}
