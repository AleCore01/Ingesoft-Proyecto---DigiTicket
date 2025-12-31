package com.digiticket.service.impl.reservation;

import com.digiticket.domain.reservation.ReservationSettings;
import com.digiticket.domain.settings.SystemSettings;
import com.digiticket.repository.reservation.ReservationSettingsRepository;
import com.digiticket.repository.settings.SystemSettingsRepository;
import com.digiticket.service.reservation.ReservationSettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationSettingsServiceImpl implements ReservationSettingsService{

    private static final int FALLBACK_TTL = 15;
    private static final int MIN_TTL = 5;
    private static final int MAX_TTL = 30;

    private final ReservationSettingsRepository repo;
    private final SystemSettingsRepository systemSettingsRepo;

    public ReservationSettingsServiceImpl(ReservationSettingsRepository repo,
                                         SystemSettingsRepository systemSettingsRepo) {
        this.repo = repo;
        this.systemSettingsRepo = systemSettingsRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public int getDefaultTtlMinutes() {
        return systemSettingsRepo.findById((short) 1)
            .map(SystemSettings::getReservationHoldTtlMinutes)
            .orElseGet(() -> repo.findById(1)
                .map(ReservationSettings::getDefaultTtlMinutes)
                .orElse(FALLBACK_TTL));
    }

    @Override
    public ReservationSettings getSettings() {
        ReservationSettings settings = repo.findById(1)
            .orElse(ReservationSettings.builder()
                .id(1)
                .defaultTtlMinutes(FALLBACK_TTL)
                .build());
        settings.setDefaultTtlMinutes(getDefaultTtlMinutes());
        return settings;
    }

    @Override
    @Transactional
    public ReservationSettings updateDefaultTtlMinutes(int minutes, Integer adminId) {
        if (minutes < MIN_TTL || minutes > MAX_TTL) {
            throw new IllegalArgumentException(
                    "El tiempo de reserva debe estar entre " + MIN_TTL + " y " + MAX_TTL + " minutos");
        }

        ReservationSettings settings = repo.findById(1)
                .orElse(ReservationSettings.builder().id(1).build());
        settings.setDefaultTtlMinutes(minutes);
        settings.setUpdatedByAdminId(adminId);
        ReservationSettings saved = repo.save(settings);

        SystemSettings sys = systemSettingsRepo.findById((short) 1)
            .orElseGet(() -> SystemSettings.builder()
                .id((short) 1)
                .maxTicketsPerPurchase(4)
                .pointsToSolesRatio(java.math.BigDecimal.ONE)
                .pointsExpirationDays(365)
                .maxTicketTransfers(1)
                .reservationHoldTtlMinutes(minutes)
                .passwordResetTokenTtlMinutes(15)
                .build());
        sys.setReservationHoldTtlMinutes(minutes);
        systemSettingsRepo.save(sys);

        return saved;
    }
}
