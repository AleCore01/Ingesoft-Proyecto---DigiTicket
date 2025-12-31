package com.digiticket.controller.admin;

import com.digiticket.domain.reservation.ReservationSettings;
import com.digiticket.service.reservation.ReservationSettingsService;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@RestController
@RequestMapping("/api/admin/reservations/config")
public class ReservationSettingsController {
    private final ReservationSettingsService settingsService;

    public ReservationSettingsController(ReservationSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ReservationConfigResponse getConfig() {
        ReservationSettings s = settingsService.getSettings();

        return new ReservationConfigResponse(
                s.getDefaultTtlMinutes(),
                s.getUpdatedByAdminId(),
                s.getUpdatedAt() != null
                        ? s.getUpdatedAt().atOffset(ZoneOffset.UTC)
                        : null
        );
    }

    @PutMapping
    public ReservationConfigResponse updateConfig(@RequestBody UpdateReservationConfigRequest request) {
        ReservationSettings s = settingsService.updateDefaultTtlMinutes(request.holdMinutes, request.adminId);
        return new ReservationConfigResponse(
                s.getDefaultTtlMinutes(),
                s.getUpdatedByAdminId(),
                s.getUpdatedAt() !=null
                        ? s.getUpdatedAt().atOffset(ZoneOffset.UTC)
                        : null);
    }

    public record ReservationConfigResponse(
            int holdMinutes,
            Integer updatedByAdminId,
            OffsetDateTime updatedAt
    ) {}
    public record UpdateReservationConfigRequest(int holdMinutes,Integer adminId) {}
}
