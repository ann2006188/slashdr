package com.slashdr.backend;

import com.slashdr.backend.entity.AppUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private AppUserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser appUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        if (!appUser.isActive()) {
            throw new UsernameNotFoundException("User is disabled: " + username);
        }

        List<String> authorities = new ArrayList<>();
        // Add the main role, e.g. ROLE_CLINIC_ADMIN, ROLE_STAFF, ROLE_DOCTOR, ROLE_SUPER_ADMIN
        authorities.add(appUser.getRole());

        // Add the clinic restriction authority, e.g. CLINIC_clinic-001
        if (appUser.getClinicId() != null && !appUser.getClinicId().isBlank()) {
            authorities.add("CLINIC_" + appUser.getClinicId());
        }

        return User.withUsername(appUser.getUsername())
                .password(appUser.getPassword())
                .authorities(authorities.toArray(new String[0]))
                .build();
    }
}
