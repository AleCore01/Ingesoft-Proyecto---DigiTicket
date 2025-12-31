package com.digiticket.dto.order;

import java.time.LocalDateTime;

public record PurchaseDTO(
        Integer id,
        Integer clientId,      // en vez de Client completo
        Integer eventId,       // en vez de Event completo
        Integer totalQuantity,
        Double totalAmount,
        String paymentMethod,
        String status,
        LocalDateTime createdAt
) {}

