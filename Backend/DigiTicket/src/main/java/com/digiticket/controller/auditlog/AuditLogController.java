package com.digiticket.controller.auditlog;

import com.digiticket.domain.auditlog.AuditLog;
import com.digiticket.service.auditlog.AuditLogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-log")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping("/user/{userId}")
    public List<AuditLog> getLogsByUser(@PathVariable Integer userId) {
        return auditLogService.getLogsByUserId(userId);
    }

    @GetMapping("/user/{userId}/last")
    public AuditLog getLastLogByUser(@PathVariable Integer userId) {
        return auditLogService.getLastLogByUserId(userId);
    }
}
