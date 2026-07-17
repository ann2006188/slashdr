package com.slashdr.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {


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

                // User management: /api/users/me is authenticated, other /api/users/** is Super Admin
                .requestMatchers("/api/users/me").authenticated()
                .requestMatchers("/api/users/**").hasRole("SUPER_ADMIN")

                // Everything else under /api requires login at minimum
                .requestMatchers("/api/**").authenticated()
                // Permit all static resource paths so the frontend can be loaded
                .requestMatchers("/", "/*.html", "/css/**", "/js/**", "/favicon.ico").permitAll()
                .anyRequest().authenticated()
            )
            // Configure custom entry point to suppress browser's native Basic Auth dialog
            .httpBasic(basic -> basic.authenticationEntryPoint((request, response, authException) -> {
                response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Invalid credentials\"}");
            }));

        return http.build();
    }
}