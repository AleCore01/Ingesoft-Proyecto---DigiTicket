package com.digiticket.dto.purchase;

public record PurchaseLimitInfoDTO(
        Integer userId,
        Integer eventId,
        Integer maxTicketsPerUser,
        Integer alreadyPurchased,
        Integer remaining
) {}
