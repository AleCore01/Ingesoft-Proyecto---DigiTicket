package com.digiticket.dto.cart;

import java.math.BigDecimal;

public record CartItemDTO(
        Long id,
        Integer eventId,
        Integer eventZoneId,
        Integer qty,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {}
