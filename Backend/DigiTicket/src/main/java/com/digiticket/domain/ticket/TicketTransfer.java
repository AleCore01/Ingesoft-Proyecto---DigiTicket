package com.digiticket.domain.ticket;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_transfer")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketTransfer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Integer ticketId;

    @Column(name = "from_client_id", nullable = false)
    private Integer fromClientId;

    @Column(name = "to_client_id", nullable = false)
    private Integer toClientId;

    @Column(name = "performed_by_user_id", nullable = false)
    private Integer performedByUserId;

    @Column(name = "reason")
    private String reason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TicketTransferStatus status;
}
