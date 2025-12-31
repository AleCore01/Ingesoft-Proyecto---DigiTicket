package com.digiticket.service.cart;

import com.digiticket.dto.cart.CartDTO;

public interface CartService {
    CartDTO getActiveCart(Integer userId);
    void clear(Integer cartId);
}
