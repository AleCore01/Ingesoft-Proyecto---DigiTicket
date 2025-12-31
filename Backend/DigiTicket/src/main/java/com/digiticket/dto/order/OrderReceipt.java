package com.digiticket.dto.order;

import java.math.BigDecimal;

public record OrderReceipt(
        Integer orderId,
        BigDecimal totalPaid,
        String paymentStatus,
        String message
) {
}
