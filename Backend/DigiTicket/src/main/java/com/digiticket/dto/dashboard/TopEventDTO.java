package com.digiticket.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopEventDTO {
    private String eventTitle;
    private Long totalQuantity;   // SUM de totalQuantity
    private java.math.BigDecimal totalAmount; // SUM de totalAmount
}
