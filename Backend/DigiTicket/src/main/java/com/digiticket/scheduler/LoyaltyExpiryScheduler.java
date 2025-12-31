package com.digiticket.scheduler;

import com.digiticket.service.loyalty.LoyaltyExpiryNotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class LoyaltyExpiryScheduler {
    private final LoyaltyExpiryNotificationService loyaltyExpiryNotificationService;

    public LoyaltyExpiryScheduler(LoyaltyExpiryNotificationService loyaltyExpiryNotificationService) {
        this.loyaltyExpiryNotificationService = loyaltyExpiryNotificationService;
    }

    @Scheduled(cron = "0 0 9 * * ?", zone = "America/Lima")
    public void runDailyExpiryNotifications() {
        // Avisos 7 días antes del vencimiento
        loyaltyExpiryNotificationService.notifyExpiringInDays(7);

        // Avisos 1 día antes del vencimiento
        loyaltyExpiryNotificationService.notifyExpiringInDays(1);
    }
}
