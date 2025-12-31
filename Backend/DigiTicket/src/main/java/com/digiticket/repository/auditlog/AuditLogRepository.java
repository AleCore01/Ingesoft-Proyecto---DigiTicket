package com.digiticket.repository.auditlog;

import com.digiticket.domain.auditlog.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

    void deleteByCreatedAtBefore(LocalDateTime date);

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Integer userId);

    AuditLog findTopByUserIdOrderByCreatedAtDesc(Integer userId);

    @Query(value = "SELECT COUNT(*) FROM audit_log a " +
            "WHERE a.action = 'LOGIN' " +
            "AND a.created_at >= :start " +
            "AND a.created_at < :end",
            nativeQuery = true)
    Integer countLoginsByDateRange(
            @Param("start") Instant start,
            @Param("end") Instant end
    );
}
