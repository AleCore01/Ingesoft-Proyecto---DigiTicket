package com.digiticket.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class TopCategoryDTO {
    private String categoryName;
    private Long totalQuantity;   // SUM de totalQuantity → Long
    private BigDecimal totalAmount; // SUM de totalAmount → BigDecimal
}
