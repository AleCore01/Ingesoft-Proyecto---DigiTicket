package com.digiticket.dto.loyalty;

import java.time.LocalDateTime;

public record LoyaltyTransactionDTO(
        Integer id,
        Integer userId,
        String type, //EARN,REDEEM,EXPIRE
        Integer points,
        Integer orderId,
        LocalDateTime createdAt,
        LocalDateTime expireAt // solo para EARN
) {
}
