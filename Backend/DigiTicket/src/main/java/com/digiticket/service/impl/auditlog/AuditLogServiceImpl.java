package com.digiticket.service.impl.auditlog;

import com.digiticket.domain.auditlog.AuditLog;
import com.digiticket.repository.auditlog.AuditLogRepository;
import com.digiticket.service.auditlog.AuditLogService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void log(Integer userId, String action, String detail) {
        AuditLog entry = new AuditLog();
        entry.setUserId(userId);
        entry.setAction(action);
        entry.setDetail(detail);
        entry.setCreatedAt(ZonedDateTime.now(ZoneId.of("America/Lima")).toLocalDateTime());
        auditLogRepository.save(entry);
    }

    // ★ Limpieza automática de logs — cada día a las 3 AM
    @Scheduled(cron = "0 0 3 * * *")
    public void deleteOldLogs() {
        LocalDateTime limit = LocalDateTime.now().minusMonths(6);
        auditLogRepository.deleteByCreatedAtBefore(limit);
    }

    @Override
    public List<AuditLog> getLogsByUserId(Integer userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public AuditLog getLastLogByUserId(Integer userId) {
        return auditLogRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
    }

}