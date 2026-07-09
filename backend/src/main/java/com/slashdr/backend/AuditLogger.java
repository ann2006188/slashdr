package com.slashdr.backend;

import com.slashdr.backend.entity.AuditLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

// A small reusable helper. Any controller just calls auditLogger.log(...) with
// one line, instead of every controller having to write its own logging code.
// It reads WHO is making the request straight from Spring Security - the same
// login info used for RBAC - so we always know exactly who did what.
@Component
public class AuditLogger {

    @Autowired
    private AuditLogRepository repository;

    public void log(String actionType, String entityType, Long entityId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        String username = (auth != null) ? auth.getName() : "unknown";

        String role = "unknown";
        if (auth != null && !auth.getAuthorities().isEmpty()) {
            // Spring Security stores roles as "ROLE_STAFF", "ROLE_CLINIC_ADMIN" etc -
            // we strip the "ROLE_" prefix so the log just says "STAFF", "CLINIC_ADMIN".
            role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        }

        AuditLog entry = new AuditLog();
        entry.setUserId(username);
        entry.setUserRole(role);
        entry.setActionType(actionType);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        repository.save(entry);
    }

    // For actions triggered by a background job, not a logged-in person -
    // there's no Authentication to read in that case, so this is separate
    // from the regular log() method above.
    public void logSystemAction(String actionType, String entityType, Long entityId) {
        AuditLog entry = new AuditLog();
        entry.setUserId("SYSTEM");
        entry.setUserRole("SYSTEM");
        entry.setActionType(actionType);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        repository.save(entry);
    }
}