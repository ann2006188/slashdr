package com.slashdr.backend;

import com.slashdr.backend.entity.AuditLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-log")
public class AuditLogController {

    @Autowired
    private AuditLogRepository repository;

    // GET /api/audit-log                                    -> everything
    // GET /api/audit-log?entityType=clinic_license&entityId=1 -> just one record's history
    @GetMapping
    public List<AuditLog> getAuditLog(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId) {

        if (entityType != null && entityId != null) {
            return repository.findByEntityTypeAndEntityId(entityType, entityId);
        }
        return repository.findAll();
    }
}