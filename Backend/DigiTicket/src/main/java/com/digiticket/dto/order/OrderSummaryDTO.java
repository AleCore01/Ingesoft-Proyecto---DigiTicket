package com.digiticket.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderSummaryDTO(
        Integer id,
        Integer userId,
        BigDecimal total,
        BigDecimal totalPaid,
        String status,
        Integer itemCount,
        LocalDateTime createdAt
) {}
