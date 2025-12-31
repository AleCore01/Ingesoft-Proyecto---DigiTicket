package com.digiticket.domain.settings;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "system_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettings {
    @Id
    private Short id; // fixed id = 1

    @Column(name = "max_tickets_per_purchase", nullable = false)
    private Integer maxTicketsPerPurchase;

    @Column(name = "points_to_soles_ratio", nullable = false, precision = 10, scale = 4)
    private BigDecimal pointsToSolesRatio;

    @Column(name = "points_expiration_days", nullable = false)
    private Integer pointsExpirationDays;

    @Column(name = "max_ticket_transfers", nullable = false)
    private Integer maxTicketTransfers;

    @Column(name = "reservation_hold_ttl_minutes", nullable = false)
    private Integer reservationHoldTtlMinutes;

    @Column(name = "password_reset_token_ttl_minutes", nullable = false)
    private Integer passwordResetTokenTtlMinutes;
}