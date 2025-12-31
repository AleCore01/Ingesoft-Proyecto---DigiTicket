package com.digiticket.domain.order;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="payment")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name ="order_id")
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private PaymentMethod method;

    @Column(name="auth_code")
    private String authcode;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private PaymentStatus status;

    private String message;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
