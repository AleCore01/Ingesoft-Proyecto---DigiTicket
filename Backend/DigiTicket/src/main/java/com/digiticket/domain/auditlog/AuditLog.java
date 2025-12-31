package com.digiticket.domain.auditlog;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer userId;

    private String action;

    @Column(columnDefinition = "TEXT")
    private String detail;

    private LocalDateTime createdAt;
}
