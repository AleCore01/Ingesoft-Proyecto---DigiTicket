package com.digiticket.scheduler;

import com.digiticket.service.reservation.ReservationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReservationScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReservationScheduler.class);
    private final ReservationService reservationService;

    public ReservationScheduler(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    // Ejecuta cada 60 segundos
    @Scheduled(fixedRate = 60_000)
    public void expireAndPromoteJob() {
        try {
            int changed = reservationService.expireAndPromote();
            if (changed > 0) {
                log.info("ReservationScheduler: cambios aplicados en expire/promote = {}", changed);
            }
        } catch (Exception e) {
            log.error("ReservationScheduler: error en expireAndPromote", e);
        }
    }
}
