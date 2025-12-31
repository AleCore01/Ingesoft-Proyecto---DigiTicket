package com.digiticket.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class DailySalesDTO {
    private BigDecimal totalSales;
    private BigDecimal variationVsYesterday; // porcentaje (+/-)
}
