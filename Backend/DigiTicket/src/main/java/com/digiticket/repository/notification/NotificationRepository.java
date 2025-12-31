package com.digiticket.repository.notification;

import com.digiticket.domain.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    // Buscar todas las notificaciones de un cliente específico
    List<Notification> findByClientId(Integer clientId);

    // Buscar todas las notificaciones que ya fueron enviadas
    List<Notification> findBySentAtIsNotNull();

    // Buscar todas las notificaciones pendientes (aún no enviadas)
    List<Notification> findBySentAtIsNull();

    // Ejemplo extra: obtener las últimas N notificaciones de un cliente
    @Query("SELECT n FROM Notification n WHERE n.client.id = :clientId ORDER BY n.createdAt DESC")
    List<Notification> findRecentByClientId(Integer clientId);
}
