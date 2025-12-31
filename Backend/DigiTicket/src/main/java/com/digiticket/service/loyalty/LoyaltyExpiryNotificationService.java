package com.digiticket.service.loyalty;

public interface LoyaltyExpiryNotificationService {
    int notifyExpiringInDays(int daysAhead);
}
