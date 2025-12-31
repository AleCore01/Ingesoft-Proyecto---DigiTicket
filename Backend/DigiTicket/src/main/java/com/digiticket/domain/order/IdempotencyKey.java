package com.digiticket.domain.order;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="idempotency_key",
        uniqueConstraints = @UniqueConstraint(columnNames = {"key","user_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IdempotencyKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name ="`key`",nullable = false,length=100)
    private String key;

    @Column(name="user_id",nullable = false)
    private Integer userId;

    @Column(name="request_hash",nullable = false,length=255)
    private String requestHash;

    @OneToOne
    @JoinColumn(name ="order_id",referencedColumnName = "id")
    private Order order;

    @Column(name="created_at",nullable = false)
    private LocalDateTime createdAt;
}
