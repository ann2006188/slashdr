package com.slashdr.backend;

import com.slashdr.backend.entity.AppUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private AppUserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String getRoleDescription(String role) {
        if ("ROLE_STAFF".equals(role)) return "OP / Nursing Staff";
        if ("ROLE_DOCTOR".equals(role)) return "Medical Practitioner";
        if ("ROLE_CLINIC_ADMIN".equals(role)) return "Compliance Officer";
        if ("ROLE_SUPER_ADMIN".equals(role)) return "Super Administrator";
        return "Clinic Staff";
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }
        String username = auth.getName();
        AppUser user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        Map<String, Object> profile = new HashMap<>();
        profile.put("username", user.getUsername());
        profile.put("role", user.getRole());
        profile.put("clinicId", user.getClinicId());
        profile.put("fullName", user.getFullName());
        profile.put("desc", getRoleDescription(user.getRole()));
        return ResponseEntity.ok(profile);
    }

    // Super Admin only (enforced in SecurityConfig)
    @GetMapping
    public List<AppUser> getAllUsers() {
        return userRepository.findAll();
    }

    // Super Admin only (enforced in SecurityConfig)
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody AppUser user) {
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
        }
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
        }
        if (user.getRole() == null || user.getRole().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        // Validate clinic_id is present for staff, doctor, and clinic admin
        if (!"ROLE_SUPER_ADMIN".equals(user.getRole())) {
            if (user.getClinicId() == null || user.getClinicId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Clinic Assignment is required for this role"));
            }
        } else {
            user.setClinicId(null); // Super Admin has no clinic mapping
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        AppUser saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
    }

    // Super Admin only (enforced in SecurityConfig)
    @PutMapping("/{id}")
    public ResponseEntity<?> editUser(@PathVariable Long id, @RequestBody AppUser details) {
        AppUser existing = userRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        existing.setFullName(details.getFullName());
        existing.setActive(details.isActive());
        existing.setRole(details.getRole());

        // Validate clinic_id
        if (!"ROLE_SUPER_ADMIN".equals(details.getRole())) {
            if (details.getClinicId() == null || details.getClinicId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Clinic Assignment is required for this role"));
            }
            existing.setClinicId(details.getClinicId());
        } else {
            existing.setClinicId(null);
        }

        AppUser saved = userRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    // Super Admin only (enforced in SecurityConfig)
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AppUser existing = userRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        String newPassword = body.get("password");
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password is required"));
        }

        existing.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(existing);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
