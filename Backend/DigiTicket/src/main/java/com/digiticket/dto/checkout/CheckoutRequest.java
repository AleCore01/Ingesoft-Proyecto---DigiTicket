package com.digiticket.dto.checkout;

public record CheckoutRequest(
   String cardToken,
   Integer pointsUsed,
   String paymentMethod
) {}
