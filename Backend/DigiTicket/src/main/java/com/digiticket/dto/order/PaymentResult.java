package com.digiticket.dto.order;

import com.digiticket.domain.order.PaymentStatus;

public record PaymentResult(
        PaymentStatus status,
        String authCode,
        String message) {

}
