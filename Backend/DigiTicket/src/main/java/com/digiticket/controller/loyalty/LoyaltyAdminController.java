package com.digiticket.controller.loyalty;

import com.digiticket.service.loyalty.LoyaltyExpiryNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/loyalty")
public class LoyaltyAdminController {
    private final LoyaltyExpiryNotificationService loyaltyExpiryNotificationService;

    public LoyaltyAdminController(LoyaltyExpiryNotificationService loyaltyExpiryNotificationService) {
        this.loyaltyExpiryNotificationService = loyaltyExpiryNotificationService;
    }

    @PostMapping("/notify-expiring")
    public ResponseEntity<?> triggerExpiryNotifications() {
        int created7 = loyaltyExpiryNotificationService.notifyExpiringInDays(7);
        int created1 = loyaltyExpiryNotificationService.notifyExpiringInDays(1);

        int total = created7 + created1;

        if (total == 0) {
            return ResponseEntity.ok(
                    new java.util.HashMap<>() {{
                        put("message", "No se encontraron clientes con puntos por vencer en las ventanas configuradas.");
                        put("createdNotifications7Days", created7);
                        put("createdNotifications1Day", created1);
                    }}
            );
        }

        return ResponseEntity.ok(
                new java.util.HashMap<>() {{
                    put("message", "Proceso de notificación ejecutado correctamente.");
                    put("createdNotifications7Days", created7);
                    put("createdNotifications1Day", created1);
                    put("totalNotifications", total);
                }}
        );
    }
}
