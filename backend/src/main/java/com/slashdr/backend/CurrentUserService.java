package com.slashdr.backend;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

// Reads two things straight from the logged-in user's Spring Security session:
// which clinic they belong to, and whether they're a Super Admin (who has no
// clinic restriction - they see across all clinics, per the requirements doc).
@Component
public class CurrentUserService {

    public boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    // Returns the logged-in user's own clinic ID, or null for a Super Admin
    // (null = "no clinic restriction applies to this user").
    public String getCurrentUserClinicId() {
        if (isSuperAdmin()) {
            return null;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        for (GrantedAuthority authority : auth.getAuthorities()) {
            String name = authority.getAuthority();
            if (name.startsWith("CLINIC_")) {
                return name.substring("CLINIC_".length());
            }
        }
        return null;
    }
}