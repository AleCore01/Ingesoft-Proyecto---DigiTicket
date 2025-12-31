package com.digiticket.dto.cart;

import java.math.BigDecimal;

public record CartItemResponseDTO(
        Integer eventId,
        Integer ticketTypeId,
        Integer qty,
        BigDecimal unitPrice
) {
}
