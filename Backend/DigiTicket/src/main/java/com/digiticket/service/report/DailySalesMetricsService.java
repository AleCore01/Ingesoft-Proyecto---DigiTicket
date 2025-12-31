package com.digiticket.service.report;

import com.digiticket.dto.report.DashboardReportDTO;

public interface DailySalesMetricsService {
    DashboardReportDTO getDashboardReport(String period); // period = DAY, WEEK, MONTH
}
