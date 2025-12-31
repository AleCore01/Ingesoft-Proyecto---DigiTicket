package com.digiticket.service.order;

import com.digiticket.dto.checkout.CheckoutRequest;
import com.digiticket.dto.order.OrderReceipt;

public interface OrderService {
    OrderReceipt checkout(Integer userId, CheckoutRequest request, String idempotencyKey);
}
