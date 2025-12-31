package com.digiticket.domain.reservation;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reservation_settings")
public class ReservationSettings {
    @Id
    private Integer id;

    @Column(name = "default_ttl_minutes", nullable = false)
    private Integer defaultTtlMinutes;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by_admin_id")
    private Integer updatedByAdminId;
}
