package com.digiticket.dto.cart;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CartDTO(
        Long id,
        Integer userId,
        List<CartItemDTO> items,
        BigDecimal total,
        LocalDateTime holdExpiresAt  // tiempo de expiración del hold activo (null si no hay)
) {}
