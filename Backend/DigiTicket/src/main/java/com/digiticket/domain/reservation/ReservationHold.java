package com.digiticket.domain.reservation;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reservation_hold")
public class ReservationHold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // INT UNSIGNED en la BD

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "event_id", nullable = false)
    private Integer eventId;

    @Column(name = "event_zone_id", nullable = false)
    private Integer eventZoneId;

    // OJO: cart_item.id es BIGINT UNSIGNED
    @Column(name = "cart_item_id")
    private Long cartItemId;

    @Column(nullable = false)
    private Integer qty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status; // WAITING | PENDING | CONFIRMED | EXPIRED

    // Usado solo para WAITING (FIFO)
    private Integer position;

    // Solo para PENDING (TTL)
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "datetime default current_timestamp")
    private LocalDateTime createdAt;

    @Column(name = "promoted_at")
    private LocalDateTime promotedAt;
}
