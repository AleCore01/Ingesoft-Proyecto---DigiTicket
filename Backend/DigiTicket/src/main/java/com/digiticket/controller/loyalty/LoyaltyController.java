package com.digiticket.controller.loyalty;

import com.digiticket.dto.loyalty.EarnPointsRequestDTO;
import com.digiticket.dto.loyalty.LoyaltyPointHistoryDTO;
import com.digiticket.dto.loyalty.PointsBalanceDTO;
import com.digiticket.service.loyalty.LoyaltyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loyalty/points")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    public LoyaltyController(LoyaltyService loyaltyService) {
        this.loyaltyService = loyaltyService;
    }

    /**
     * Obtener saldo de puntos
     * GET /api/loyalty/points/balance?clientId={clientId}
     */
    @GetMapping("/balance")
    public ResponseEntity<PointsBalanceDTO> getBalance(@RequestParam Integer clientId) {
        return ResponseEntity.ok(loyaltyService.getBalance(clientId));
    }

    /**
     * Historial de puntos
     * GET /api/loyalty/points/history?clientId={clientId}
     */
    @GetMapping("/history")
    public ResponseEntity<List<LoyaltyPointHistoryDTO>> getHistory(@RequestParam Integer clientId) {
        return ResponseEntity.ok(loyaltyService.getHistory(clientId));
    }

    /**
     * (Opcional) Generar puntos para pruebas
     * POST /api/loyalty/points/earn
     */
    @PostMapping("/earn")
    public ResponseEntity<Void> earnPoints(@RequestBody EarnPointsRequestDTO req) {
        loyaltyService.addEarnedPoints(req.getClientId(), req.getTotalAmount());
        return ResponseEntity.noContent().build();
    }
}
