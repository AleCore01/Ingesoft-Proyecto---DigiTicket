package com.digiticket.util.report;

import com.digiticket.dto.report.DashboardReportDTO;
import com.digiticket.dto.report.DailySalesMetricsDTO;
import com.digiticket.dto.dashboard.TopCategoryDTO;
import com.digiticket.dto.dashboard.TopEventDTO;
import com.digiticket.dto.dashboard.RevenueTicketsMetricDTO;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;

import java.io.ByteArrayOutputStream;
import java.text.DecimalFormat;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

public class ReportPdfGenerator {

    public static byte[] generateDashboardPdf(DashboardReportDTO report) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            String html = HtmlDashboardTemplate.render(report); // ← renderizas HTML

            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();

            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF", e);
        }
    }
}
