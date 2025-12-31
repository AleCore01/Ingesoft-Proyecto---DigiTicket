package com.digiticket.repository.reservation;

import com.digiticket.domain.reservation.ReservationSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationSettingsRepository extends JpaRepository<ReservationSettings, Integer> {
}
