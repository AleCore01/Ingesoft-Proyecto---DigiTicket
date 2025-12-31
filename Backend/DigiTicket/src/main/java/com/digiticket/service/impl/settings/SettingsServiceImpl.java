package com.digiticket.service.impl.settings;

import com.digiticket.domain.settings.SystemSettings;
import com.digiticket.dto.settings.SystemSettingsDTO;
import com.digiticket.repository.settings.SystemSettingsRepository;
import com.digiticket.service.settings.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class SettingsServiceImpl implements SettingsService {
    private final SystemSettingsRepository repo;

    public SettingsServiceImpl(SystemSettingsRepository repo) {
        this.repo = repo;
    }

    private SystemSettings settings() {
        return repo.findById((short) 1)
                .orElseThrow(() -> new IllegalStateException("system_settings row 1 missing"));
    }

    public int getMaxTicketsPerPurchase() { return settings().getMaxTicketsPerPurchase(); }
    public BigDecimal getPointsToSolesRatio() { return settings().getPointsToSolesRatio(); }
    public int getPointsExpirationDays() { return settings().getPointsExpirationDays(); }
    public int getMaxTicketTransfers() { return settings().getMaxTicketTransfers(); }
    public int getReservationHoldTtlMinutes() { return settings().getReservationHoldTtlMinutes(); }
    public int getPasswordResetTokenTtlMinutes() { return settings().getPasswordResetTokenTtlMinutes(); }

    @Override
    public SystemSettingsDTO getSettingsSnapshot() {
        return toDto(settings());
    }

    @Override
    @Transactional
    public SystemSettingsDTO updateSettings(SystemSettingsDTO payload) {
        validate(payload);
        SystemSettings entity = settings();
        entity.setMaxTicketsPerPurchase(payload.maxTicketsPerPurchase());
        entity.setPointsToSolesRatio(payload.pointsToSolesRatio());
        entity.setPointsExpirationDays(payload.pointsExpirationDays());
        entity.setMaxTicketTransfers(payload.maxTicketTransfers());
        entity.setReservationHoldTtlMinutes(payload.reservationHoldTtlMinutes());
        entity.setPasswordResetTokenTtlMinutes(payload.passwordResetTokenTtlMinutes());
        repo.save(entity);
        return toDto(entity);
    }

    private static void validate(SystemSettingsDTO dto) {
        if (dto.maxTicketsPerPurchase() <= 0) {
            throw new IllegalArgumentException("maxTicketsPerPurchase must be greater than zero");
        }
        if (dto.maxTicketTransfers() < 0) {
            throw new IllegalArgumentException("maxTicketTransfers cannot be negative");
        }
        if (dto.pointsExpirationDays() <= 0) {
            throw new IllegalArgumentException("pointsExpirationDays must be greater than zero");
        }
        if (dto.reservationHoldTtlMinutes() <= 0) {
            throw new IllegalArgumentException("reservationHoldTtlMinutes must be greater than zero");
        }
        if (dto.passwordResetTokenTtlMinutes() <= 0) {
            throw new IllegalArgumentException("passwordResetTokenTtlMinutes must be greater than zero");
        }
        if (dto.pointsToSolesRatio() == null || dto.pointsToSolesRatio().signum() <= 0) {
            throw new IllegalArgumentException("pointsToSolesRatio must be positive");
        }
    }

    private static SystemSettingsDTO toDto(SystemSettings entity) {
        return new SystemSettingsDTO(
                entity.getMaxTicketsPerPurchase(),
                entity.getPointsToSolesRatio(),
                entity.getPointsExpirationDays(),
                entity.getMaxTicketTransfers(),
                entity.getReservationHoldTtlMinutes(),
                entity.getPasswordResetTokenTtlMinutes()
        );
    }
}
