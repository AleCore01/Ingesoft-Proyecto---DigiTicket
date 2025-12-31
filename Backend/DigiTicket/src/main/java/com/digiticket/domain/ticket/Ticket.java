package com.digiticket.domain.ticket;

import com.digiticket.domain.order.Purchase;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_id", nullable = false, foreignKey = @ForeignKey(name = "fk_ticket_purchase"))
    private Purchase purchase;

    @Column(name = "event_zone_id", nullable = false)
    private Integer eventZoneId;

    @Column(name = "is_presale", nullable = false)
    private boolean presale;

    @Column(name = "ticket_url")
    private String ticketUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TicketStatus status;

    @Column(name = "owner_client_id", nullable = false)
    private Integer ownerClientId;

    @Column(name = "transfer_count", nullable = false)
    private Integer transferCount;

    @PrePersist
    void onCreate() {
        if (ownerClientId == null && purchase != null && purchase.getClient() != null) {
            ownerClientId = purchase.getClient().getId();
        }
        if (transferCount == null) {
            transferCount = 0;
        }
    }
}
