package com.digiticket.controller.notification;

import com.digiticket.domain.notification.Notification;
import com.digiticket.service.notification.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // ===============================
    // CRUD básico
    // ===============================

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        Notification created = notificationService.createNotification(notification);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notification> getNotificationById(@PathVariable Integer id) {
        Notification n = notificationService.getNotificationById(id);
        return ResponseEntity.ok(n);
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    // ===============================
    // Consultas específicas
    // ===============================

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<Notification>> getNotificationsByClient(@PathVariable Integer clientId) {
        return ResponseEntity.ok(notificationService.getNotificationsByClientId(clientId));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Notification>> getPendingNotifications() {
        return ResponseEntity.ok(notificationService.getPendingNotifications());
    }

    @GetMapping("/sent")
    public ResponseEntity<List<Notification>> getSentNotifications() {
        return ResponseEntity.ok(notificationService.getSentNotifications());
    }

    @PutMapping("/{id}/mark-sent")
    public ResponseEntity<Notification> markAsSent(@PathVariable Integer id) {
        Notification updated = notificationService.markAsSent(id);
        return ResponseEntity.ok(updated);
    }
}
