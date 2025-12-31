package com.digiticket.util.report;

import com.digiticket.dto.report.DashboardReportDTO;
import com.digiticket.dto.report.DailySalesMetricsDTO;
import com.digiticket.dto.dashboard.TopCategoryDTO;
import com.digiticket.dto.dashboard.TopEventDTO;
import com.digiticket.dto.dashboard.RevenueTicketsMetricDTO;

import java.text.DecimalFormat;
import java.util.List;

public class HtmlDashboardTemplate {

    public static String render(DashboardReportDTO report) {
        DecimalFormat df = new DecimalFormat("#0.00");

        DailySalesMetricsDTO daily = report.getDailySales();
        List<TopCategoryDTO> topCategories = report.getTopCategories();
        List<TopEventDTO> topEvents = report.getTopEvents();
        List<RevenueTicketsMetricDTO> revenueMetrics = report.getRevenueMetrics();

        StringBuilder sb = new StringBuilder();

        sb.append("""
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8" />
                    <style>
                        body { font-family: Arial, sans-serif; margin: 28px; color: #222; }
                        h1 { text-align: center; color: #2b4a6f; }
                        .section { margin-top: 18px; }
                        .card {
                            border: 1px solid #e0e0e0;
                            border-radius: 8px;
                            padding: 12px 14px;
                            background: #fbfbfb;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
                        }
                        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                        th, td { padding: 8px 10px; border: 1px solid #e9e9e9; text-align: left; font-size: 12px; }
                        th { background: #f2f6fb; font-weight: 600; }
                        .small { font-size: 11px; color: #666; }
                        .metric { font-size: 20px; font-weight: 700; color: #1f5a91; }
                        .row { display: flex; gap: 12px; }
                        .col { flex: 1; }
                    </style>
                </head>
                <body>
                <h1>Reporte del Dashboard</h1>
                """);

        // Daily Sales
        sb.append("<div class=\"section card\">")
                .append("<h2>Métricas Diarias</h2>")
                .append("<div class=\"row\">");

        sb.append("<div class=\"col\">")
                .append("<div class=\"small\">Entradas vendidas hoy</div>")
                .append("<div class=\"metric\">").append(daily.getTicketsSoldToday()).append("</div>")
                .append("<div class=\"small\">Variación: ").append(df.format(daily.getTicketsVariationPercent())).append("%</div>")
                .append("</div>");

        sb.append("<div class=\"col\">")
                .append("<div class=\"small\">Ingresos hoy (S/)</div>")
                .append("<div class=\"metric\">").append(df.format(daily.getRevenueToday())).append("</div>")
                .append("<div class=\"small\">Variación: ").append(df.format(daily.getRevenueVariationPercent())).append("%</div>")
                .append("</div>");

        sb.append("<div class=\"col\">")
                .append("<div class=\"small\">Visitas hoy</div>")
                .append("<div class=\"metric\">").append(daily.getTotalVisitsToday()).append("</div>")
                .append("<div class=\"small\">Variación: ").append(df.format(daily.getVisitsVariationPercent())).append("%</div>")
                .append("</div>");

        sb.append("</div></div>"); // close row + card

        // Top Categories
        sb.append("<div class=\"section card\">")
                .append("<h2>Top Categorías</h2>")
                .append("<table>")
                .append("<thead><tr><th>Categoría</th><th>Entradas</th><th>Ingresos (S/)</th></tr></thead>")
                .append("<tbody>");

        for (TopCategoryDTO c : topCategories) {
            sb.append("<tr>")
                    .append("<td>").append(escapeHtml(c.getCategoryName())).append("</td>")
                    .append("<td>").append(c.getTotalQuantity()).append("</td>")
                    .append("<td>").append(df.format(c.getTotalAmount())).append("</td>")
                    .append("</tr>");
        }

        sb.append("</tbody></table></div>");

        // Top Events
        sb.append("<div class=\"section card\">")
                .append("<h2>Top Eventos</h2>")
                .append("<table>")
                .append("<thead><tr><th>Evento</th><th>Entradas</th><th>Ingresos (S/)</th></tr></thead>")
                .append("<tbody>");

        for (TopEventDTO e : topEvents) {
            sb.append("<tr>")
                    .append("<td>").append(escapeHtml(e.getEventTitle())).append("</td>")
                    .append("<td>").append(e.getTotalQuantity()).append("</td>")
                    .append("<td>").append(df.format(e.getTotalAmount())).append("</td>")
                    .append("</tr>");
        }

        sb.append("</tbody></table></div>");

        // Revenue / Tickets Metrics
        sb.append("<div class=\"section card\">")
                .append("<h2>Métricas de Ingresos y Entradas</h2>")
                .append("<table>")
                .append("<thead><tr><th>Período</th><th>Entradas</th><th>Ingresos (S/)</th></tr></thead>")
                .append("<tbody>");

        for (RevenueTicketsMetricDTO r : revenueMetrics) {
            sb.append("<tr>")
                    .append("<td>").append(escapeHtml(r.getLabel())).append("</td>")
                    .append("<td>").append(r.getTicketsSold()).append("</td>")
                    .append("<td>").append(df.format(r.getRevenue())).append("</td>")
                    .append("</tr>");
        }

        sb.append("</tbody></table></div>");

        sb.append("</body></html>");

        return sb.toString();
    }

    // pequeña utilidad para evitar que títulos con <>& rompan el HTML
    private static String escapeHtml(Object o) {
        if (o == null) return "";
        String s = o.toString();
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
