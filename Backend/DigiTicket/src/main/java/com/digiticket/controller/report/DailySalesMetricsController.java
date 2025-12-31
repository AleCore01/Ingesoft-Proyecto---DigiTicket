package com.digiticket.controller.report;

import com.digiticket.dto.report.DashboardReportDTO;
import com.digiticket.service.report.DailySalesMetricsService;
import com.digiticket.util.report.ReportCsvGenerator;
import com.digiticket.util.report.ReportPdfGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador para exponer los endpoints del dashboard completo.
 * Incluye métricas diarias, top categorías, top eventos y métricas de ingresos/entradas.
 */
@RestController
@RequestMapping("/api/reports/dashboard")
@RequiredArgsConstructor
public class DailySalesMetricsController {

    private final DailySalesMetricsService service;

    /**
     * Endpoint para obtener el dashboard completo en formato JSON.
     * @param period DAY, WEEK, MONTH
     */
    @GetMapping
    public ResponseEntity<DashboardReportDTO> getDashboardReport(@RequestParam(defaultValue = "DAY") String period) {
        DashboardReportDTO report = service.getDashboardReport(period);
        return ResponseEntity.ok(report);
    }

    /**
     * Endpoint para descargar el dashboard completo en formato PDF.
     * @param period DAY, WEEK, MONTH
     */
    @GetMapping("/pdf")
    public ResponseEntity<byte[]> downloadPdfReport(@RequestParam(defaultValue = "DAY") String period) {
        DashboardReportDTO report = service.getDashboardReport(period);
        byte[] pdfBytes = ReportPdfGenerator.generateDashboardPdf(report);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=dashboard-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    /**
     * Endpoint para descargar el dashboard completo en formato CSV.
     * @param period DAY, WEEK, MONTH
     */
    @GetMapping("/csv")
    public ResponseEntity<byte[]> downloadCsvReport(@RequestParam(defaultValue = "DAY") String period) {
        DashboardReportDTO report = service.getDashboardReport(period);
        byte[] csvBytes = ReportCsvGenerator.generateDashboardCsv(report);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=dashboard-report.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(csvBytes);
    }
}
