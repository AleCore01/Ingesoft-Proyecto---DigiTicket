package com.digiticket.service.settings;

import com.digiticket.dto.settings.SystemSettingsDTO;

import java.math.BigDecimal;

public interface SettingsService {
    int getMaxTicketsPerPurchase();
    BigDecimal getPointsToSolesRatio();
    int getPointsExpirationDays();
    int getMaxTicketTransfers();
    int getReservationHoldTtlMinutes();
    int getPasswordResetTokenTtlMinutes();

    SystemSettingsDTO getSettingsSnapshot();
    SystemSettingsDTO updateSettings(SystemSettingsDTO payload);
}
