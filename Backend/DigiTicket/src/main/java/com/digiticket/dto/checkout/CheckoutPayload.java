package com.digiticket.dto.checkout;

public record CheckoutPayload(
   Integer userId,
   String cardToken,
   Integer pointsUsed,
   String paymentMethod
) {}
