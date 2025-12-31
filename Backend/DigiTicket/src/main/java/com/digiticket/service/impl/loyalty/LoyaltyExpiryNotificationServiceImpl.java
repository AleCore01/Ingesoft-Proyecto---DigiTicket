package com.digiticket.service.impl.loyalty;

import com.digiticket.domain.loyalty.LoyaltyPoint;
import com.digiticket.domain.loyalty.LoyaltyPointStatus;
import com.digiticket.domain.notification.Notification;
import com.digiticket.domain.user.Client;
import com.digiticket.repository.loyalty.LoyaltyPointRepository;
import com.digiticket.repository.user.ClientRepository;
import com.digiticket.service.loyalty.LoyaltyExpiryNotificationService;
import com.digiticket.service.notification.NotificationService;
import com.digiticket.util.EmailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LoyaltyExpiryNotificationServiceImpl implements LoyaltyExpiryNotificationService {
    private final LoyaltyPointRepository loyaltyPointRepository;
    private final ClientRepository clientRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public LoyaltyExpiryNotificationServiceImpl(LoyaltyPointRepository loyaltyPointRepository,
                                                ClientRepository clientRepository,
                                                NotificationService notificationService,
                                                EmailService emailService) {
        this.loyaltyPointRepository = loyaltyPointRepository;
        this.clientRepository = clientRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public int notifyExpiringInDays(int daysAhead) {
        LocalDate today = LocalDate.now();
        LocalDate targetDate = today.plusDays(daysAhead);

        LocalDateTime from = targetDate.atStartOfDay();
        LocalDateTime to = targetDate.plusDays(1).atStartOfDay();

        List<LoyaltyPoint> expiringPoints = loyaltyPointRepository
                .findByStatusAndExpiresAtBetween(
                        LoyaltyPointStatus.ACTIVE,
                        from,
                        to
                );

        if (expiringPoints.isEmpty()) {
            return 0;
        }

        Map<Integer, List<LoyaltyPoint>> pointsByClient = expiringPoints.stream()
                .collect(Collectors.groupingBy(LoyaltyPoint::getClientId));

        int createdNotifications = 0;

        for (Map.Entry<Integer, List<LoyaltyPoint>> entry : pointsByClient.entrySet()) {
            Integer clientId = entry.getKey();
            List<LoyaltyPoint> pointsList = entry.getValue();

            int totalPoints = pointsList.stream()
                    .mapToInt(LoyaltyPoint::getPoints)
                    .sum();

            if (totalPoints <= 0) {
                continue;
            }

            Client client = clientRepository.findById(clientId).orElse(null);
            if (client == null || client.getUser() == null) {
                continue;
            }

            String title;
            if (daysAhead == 7) {
                title = "Tus puntos vencerán en 7 días";
            } else if (daysAhead == 1) {
                title = "Tus puntos vencen mañana";
            } else {
                title = "Tus puntos están por vencer";
            }

            String message = String.format(
                    "Hola %s,\n\n" +
                            "Tienes %d puntos que vencerán el %s.\n" +
                            "Te recomendamos usarlos antes de esa fecha para no perderlos.\n\n" +
                            "¡Gracias por usar DigiTicket!",
                    client.getUser().getFirstName(),
                    totalPoints,
                    targetDate
            );

            Notification notification = Notification.builder()
                    .client(client)
                    .title(title)
                    .message(message)
                    .build();

            Notification saved = notificationService.createNotification(notification);

            try {
                String toEmail = client.getUser().getEmail();
                emailService.sendNotificationEmail(toEmail, title, message);

                notificationService.markAsSent(saved.getId());
            } catch (Exception e) {
                e.printStackTrace();
            }


            createdNotifications++;
        }

        return createdNotifications;
    }
}
