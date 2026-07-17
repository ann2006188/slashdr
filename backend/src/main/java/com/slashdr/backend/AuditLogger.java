package com.slashdr.backend;

import com.slashdr.backend.entity.AuditLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Map;

// A small reusable helper. Any controller just calls auditLogger.log(...) with
// one line, instead of every controller having to write its own logging code.
// It reads WHO is making the request straight from Spring Security - the same
// login info used for RBAC - so we always know exactly who did what.
@Component
public class AuditLogger {

    @Autowired
    private AuditLogRepository repository;

    public void log(String actionType, String entityType, Long entityId) {
        log(actionType, entityType, entityId, (String) null);
    }

    public void log(String actionType, String entityType, Long entityId, Map<String, Object> metadata) {
        log(actionType, entityType, entityId, mapToJson(metadata));
    }

    public void log(String actionType, String entityType, Long entityId, String metaJson) {
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
        entry.setMetaJson(metaJson);
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

    private String mapToJson(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) {
                sb.append(",");
            }
            first = false;
            sb.append("\"").append(escapeJson(entry.getKey())).append("\":");
            Object val = entry.getValue();
            if (val == null) {
                sb.append("null");
            } else if (val instanceof Number || val instanceof Boolean) {
                sb.append(val);
            } else {
                sb.append("\"").append(escapeJson(val.toString())).append("\"");
            }
        }
        sb.append("}");
        return sb.toString();
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\b", "\\b")
                  .replace("\f", "\\f")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
}