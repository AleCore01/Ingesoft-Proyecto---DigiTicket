package com.digiticket.util.report;

import com.digiticket.dto.report.DashboardReportDTO;
import com.digiticket.dto.report.DailySalesMetricsDTO;
import com.digiticket.dto.dashboard.TopCategoryDTO;
import com.digiticket.dto.dashboard.TopEventDTO;
import com.digiticket.dto.dashboard.RevenueTicketsMetricDTO;

import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;

public class ReportCsvGenerator {

    public static byte[] generateDashboardCsv(DashboardReportDTO report) {
        DecimalFormat df = new DecimalFormat("#0.00");
        StringBuilder sb = new StringBuilder();

        // --- Daily Sales ---
        DailySalesMetricsDTO daily = report.getDailySales();
        sb.append("Métrica,Valor Hoy,Variación (%)\n");
        sb.append("Entradas vendidas,").append(daily.getTicketsSoldToday()).append(",")
                .append(df.format(daily.getTicketsVariationPercent())).append("\n");
        sb.append("Ingresos (S/),").append(df.format(daily.getRevenueToday())).append(",")
                .append(df.format(daily.getRevenueVariationPercent())).append("\n");
        sb.append("Visitas,").append(daily.getTotalVisitsToday()).append(",")
                .append(df.format(daily.getVisitsVariationPercent())).append("\n\n");

        // --- Top Categories ---
        sb.append("Top Categorías,Entradas,Ingresos (S/)\n");
        for (TopCategoryDTO c : report.getTopCategories()) {
            sb.append(c.getCategoryName()).append(",")
                    .append(c.getTotalQuantity()).append(",")
                    .append(df.format(c.getTotalAmount())).append("\n");
        }
        sb.append("\n");

        // --- Top Events ---
        sb.append("Top Eventos,Entradas,Ingresos (S/)\n");
        for (TopEventDTO e : report.getTopEvents()) {
            sb.append(e.getEventTitle()).append(",")
                    .append(e.getTotalQuantity()).append(",")
                    .append(df.format(e.getTotalAmount())).append("\n");
        }
        sb.append("\n");

        // --- Revenue / Tickets Metrics ---
        sb.append("Período,Entradas,Ingresos (S/)\n");
        for (RevenueTicketsMetricDTO r : report.getRevenueMetrics()) {
            sb.append(r.getLabel()).append(",")
                    .append(r.getTicketsSold()).append(",")
                    .append(df.format(r.getRevenue())).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}
