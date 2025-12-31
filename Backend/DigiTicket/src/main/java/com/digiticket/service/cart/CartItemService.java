package com.digiticket.service.cart;

import com.digiticket.dto.cart.CartDTO;

public interface CartItemService {
    CartDTO addItem(Integer userId, Integer eventId, Integer eventZoneId, Integer qty);
    CartDTO updateItem(Integer userId, Long cartItemId, Integer qty);
    CartDTO removeItem(Integer userId, Long cartItemId);
}
