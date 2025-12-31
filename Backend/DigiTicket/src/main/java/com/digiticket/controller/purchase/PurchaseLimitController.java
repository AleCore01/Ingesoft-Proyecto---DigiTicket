package com.digiticket.controller.purchase;

import com.digiticket.dto.purchase.PurchaseLimitInfoDTO;
import com.digiticket.service.purchase.PurchaseLimitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{eventId}/purchase-limit")
public class PurchaseLimitController {

    private final PurchaseLimitService purchaseLimitService;

    public PurchaseLimitController(PurchaseLimitService purchaseLimitService) {
        this.purchaseLimitService = purchaseLimitService;
    }

    /**
     * Consultar límite restante de compra para un evento.
     * GET /api/events/{eventId}/purchase-limit?userId={userId}
     */
    @GetMapping
    public ResponseEntity<PurchaseLimitInfoDTO> getPurchaseLimit(
            @PathVariable Integer eventId,
            @RequestParam Integer userId) {
        
        PurchaseLimitInfoDTO info = purchaseLimitService.getLimitInfo(userId, eventId);
        return ResponseEntity.ok(info);
    }
}
