package com.digiticket.service.notification;

import com.digiticket.domain.notification.Notification;

import java.util.List;

public interface NotificationService {

    Notification createNotification(Notification notification);
    Notification getNotificationById(Integer id);
    List<Notification> getAllNotifications();
    List<Notification> getNotificationsByClientId(Integer clientId);
    List<Notification> getPendingNotifications();
    List<Notification> getSentNotifications();
    Notification markAsSent(Integer id);
}
