package com.digiticket.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor            // Constructor vacío requerido por JPA y frameworks
@AllArgsConstructor           // Constructor con (label, ticketsSold, revenue)
public class RevenueTicketsMetricDTO {

    private String label;     // Ej: "2025-W12", "2025-03", "2025"
    private Long ticketsSold;
    private Double revenue;
}
