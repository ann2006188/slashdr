package com.slashdr.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Temporary hardcoded test users, one per role from the requirements doc.
    // Real user management (real people, real passwords, tied to a real clinic)
    // is a later step - this just proves RBAC itself works end-to-end.
    @Bean
    public InMemoryUserDetailsManager userDetailsService(PasswordEncoder encoder) {
        UserDetails staff = User.withUsername("staff1")
                .password(encoder.encode("staff123"))
                .authorities("ROLE_STAFF", "CLINIC_clinic-001")
                .build();

        UserDetails doctor = User.withUsername("doctor1")
                .password(encoder.encode("doctor123"))
                .authorities("ROLE_DOCTOR", "CLINIC_clinic-001")
                .build();

        UserDetails clinicAdmin = User.withUsername("admin1")
                .password(encoder.encode("admin123"))
                .authorities("ROLE_CLINIC_ADMIN", "CLINIC_clinic-001")
                .build();

        // Second clinic's admin - exists purely so we can prove clinic isolation
        // actually works (staff/admin at one clinic cannot see another clinic's data).
        UserDetails clinicAdmin2 = User.withUsername("admin2")
                .password(encoder.encode("admin123"))
                .authorities("ROLE_CLINIC_ADMIN", "CLINIC_clinic-002")
                .build();

        UserDetails superAdmin = User.withUsername("superadmin1")
                .password(encoder.encode("super123"))
                .authorities("ROLE_SUPER_ADMIN")
                .build();

        return new InMemoryUserDetailsManager(staff, doctor, clinicAdmin, clinicAdmin2, superAdmin);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disabling CSRF: this is a stateless REST API (no browser cookie sessions),
            // called from Postman/a frontend using Basic Auth on every request.
            // CSRF protection is a browser-session concern and doesn't apply here.
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Consent templates: only admins can create/edit/manage (matches doc C.3)
                .requestMatchers(HttpMethod.POST, "/api/consent-templates/**").hasAnyRole("CLINIC_ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/consent-templates/**").hasAnyRole("CLINIC_ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/consent-templates/**").hasAnyRole("CLINIC_ADMIN", "SUPER_ADMIN")
                // Anyone logged in can view templates
                .requestMatchers("/api/consent-templates/**").authenticated()

                // Consent records: all 4 roles can capture/view for now.
                // Clinic-level ownership filtering (staff only seeing their own clinic's
                // records) is data-level logic we'll add when we build the search/register endpoint.
                .requestMatchers("/api/consent-records/**").authenticated()

                // Clinic licenses: only admins can create/renew (matches doc C.3 "Add/edit clinic licenses")
                .requestMatchers(HttpMethod.POST, "/api/clinic-licenses/**").hasAnyRole("CLINIC_ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/clinic-licenses/**").hasAnyRole("CLINIC_ADMIN", "SUPER_ADMIN")
                // Cross-clinic summary is Super Admin only (must be listed before the general rule below)
                .requestMatchers("/api/clinic-licenses/summary").hasRole("SUPER_ADMIN")
                // Everyone else viewing licenses: Doctor (view-only), Clinic Admin, Super Admin - NOT Staff
                .requestMatchers("/api/clinic-licenses/**").hasAnyRole("DOCTOR", "CLINIC_ADMIN", "SUPER_ADMIN")

                // Audit log: admins only (it's sensitive - who did what, across the system)
                .requestMatchers("/api/audit-log/**").hasAnyRole("CLINIC_ADMIN", "SUPER_ADMIN")

                // Everything else under /api requires login at minimum
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .httpBasic(basic -> {});

        return http.build();
    }
}