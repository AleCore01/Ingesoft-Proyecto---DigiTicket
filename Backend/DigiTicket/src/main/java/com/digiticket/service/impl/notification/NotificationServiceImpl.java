package com.digiticket.service.impl.notification;

import com.digiticket.domain.notification.Notification;
import com.digiticket.repository.notification.NotificationRepository;
import com.digiticket.service.notification.NotificationService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public Notification createNotification(Notification notification) {
        // Se puede setear createdAt automáticamente por JPA, pero verificamos que no venga con sentAt
        if (notification.getSentAt() == null) {
            notification.setSentAt(null);
        }
        return notificationRepository.save(notification);
    }

    @Override
    public Notification getNotificationById(Integer id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id " + id));
    }

    @Override
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    @Override
    public List<Notification> getNotificationsByClientId(Integer clientId) {
        return notificationRepository.findByClientId(clientId);
    }

    @Override
    public List<Notification> getPendingNotifications() {
        return notificationRepository.findBySentAtIsNull();
    }

    @Override
    public List<Notification> getSentNotifications() {
        return notificationRepository.findBySentAtIsNotNull();
    }

    @Override
    public Notification markAsSent(Integer id) {
        Notification notification = getNotificationById(id);
        notification.setSentAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }
}
