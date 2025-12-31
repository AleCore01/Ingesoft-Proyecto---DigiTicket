package com.digiticket.dto.settings;

import java.math.BigDecimal;

public record SystemSettingsDTO(
        int maxTicketsPerPurchase,
        BigDecimal pointsToSolesRatio,
        int pointsExpirationDays,
        int maxTicketTransfers,
        int reservationHoldTtlMinutes,
        int passwordResetTokenTtlMinutes
) {}
