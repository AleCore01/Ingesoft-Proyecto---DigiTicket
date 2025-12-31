package com.digiticket.dto.order;

import java.time.LocalDateTime;

public record HistoryPurchaseDTO(
        Integer purchaseId,      // <-- Integer
        Integer totalQuantity,
        Double totalAmount,
        String paymentMethod,
        String status,
        LocalDateTime createdAt,
        Integer eventId,         // <-- Integer
        String eventTitle,
        LocalDateTime eventStartsAt
) {}

