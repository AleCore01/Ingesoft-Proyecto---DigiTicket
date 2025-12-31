package com.digiticket.service.reservation;

import com.digiticket.domain.reservation.ReservationSettings;

public interface ReservationSettingsService {
    int getDefaultTtlMinutes();
    ReservationSettings getSettings();
    ReservationSettings updateDefaultTtlMinutes(int minutes, Integer adminId);
}
