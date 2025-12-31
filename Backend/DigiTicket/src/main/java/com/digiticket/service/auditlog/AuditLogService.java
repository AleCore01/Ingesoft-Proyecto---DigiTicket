package com.digiticket.service.auditlog;

import com.digiticket.domain.auditlog.AuditLog;

import java.util.List;

public interface AuditLogService {
    void log(Integer userId, String action, String detail);
    List<AuditLog> getLogsByUserId(Integer userId);
    AuditLog getLastLogByUserId(Integer userId);
}
