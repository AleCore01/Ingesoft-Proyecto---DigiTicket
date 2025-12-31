package com.digiticket.controller.ticket;

import com.digiticket.service.reservation.ReservationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@RestController
@RequestMapping("/api/cart")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping("/hold")
    public ResponseEntity<HoldResponse> placeHold(@RequestBody HoldRequest request) {
        if (request == null || request.userId() == null || request.cartId() == null) {
            return ResponseEntity.badRequest()
                    .body(new HoldResponse(null, "BAD_REQUEST: userId/cartId requeridos", null));
        }

        Integer lastHoldId = reservationService.placeHold(request.userId(), request.cartId());

        int ttl = reservationService.getCurrentTtlMinutes();
        OffsetDateTime expiresAt = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(ttl);
        return ResponseEntity.ok(new HoldResponse(lastHoldId, "CREATED", expiresAt));
    }

    public static record HoldRequest(Integer userId, Integer cartId) {}

    public static record HoldResponse(Integer holdId, String status, OffsetDateTime expiresAt) {}
}
