package com.slashdr.backend;

import com.slashdr.backend.entity.AuditLog;
import com.slashdr.backend.entity.ClinicLicense;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clinic-licenses")
public class ClinicLicenseController {

    @Autowired
    private ClinicLicenseRepository repository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditLogger auditLogger;

    @Autowired
    private CurrentUserService currentUserService;

    private String computeStatus(LocalDate expiryDate) {
        long daysToExpiry = ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);
        if (daysToExpiry > 30) return "Valid";
        if (daysToExpiry >= 8) return "Renewal Due Soon";
        if (daysToExpiry >= 0) return "Urgent";
        return "Expired";
    }

    private void refreshStatus(ClinicLicense license) {
        if (!"Superseded".equals(license.getStatus())) {
            license.setStatus(computeStatus(license.getExpiryDate()));
        }
        boolean isDuplicate = repository.findByClinicId(license.getClinicId()).stream()
                .anyMatch(l -> !l.getId().equals(license.getId())
                        && l.getLicenseType().equals(license.getLicenseType())
                        && !"Superseded".equals(l.getStatus()));
        license.setDuplicateWarning(isDuplicate ? true : null);
    }

    @PostMapping
    public ResponseEntity<?> createLicense(@RequestBody ClinicLicense license) {
        if (license.getExpiryDate() == null || license.getIssueDate() == null || !license.getExpiryDate().isAfter(license.getIssueDate())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Expiry date must be after issue date"));
        }

        if (currentUserService.isSuperAdmin()) {
            if (license.getClinicId() == null) {
                return ResponseEntity.badRequest().build();
            }
        } else {
            license.setClinicId(currentUserService.getCurrentUserClinicId());
        }

        license.setStatus(computeStatus(license.getExpiryDate()));
        ClinicLicense saved = repository.save(license);
        Map<String, Object> meta = new HashMap<>();
        meta.put("licenseType", saved.getLicenseType());
        meta.put("licenseNumber", saved.getLicenseNumber());
        meta.put("expiryDate", saved.getExpiryDate() != null ? saved.getExpiryDate().toString() : null);
        meta.put("documentUrl", saved.getDocumentUrl());
        auditLogger.log("CREATED", "clinic_license", saved.getId(), meta);

        // Doc B.1 business rule: "System flags if two 'current' entries of the
        // same type exist for one clinic (likely a data error)" - this is a
        // FLAG (a warning), not a block, so creation still succeeds either way.
        boolean isDuplicate = repository.findByClinicId(saved.getClinicId()).stream()
                .anyMatch(l -> !l.getId().equals(saved.getId())
                        && l.getLicenseType().equals(saved.getLicenseType())
                        && !"Superseded".equals(l.getStatus()));
        saved.setDuplicateWarning(isDuplicate ? true : null);

        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<ClinicLicense> getLicenses(@RequestParam(required = false) String clinicId) {
        List<ClinicLicense> licenses;

        if (currentUserService.isSuperAdmin()) {
            licenses = (clinicId != null) ? repository.findByClinicId(clinicId) : repository.findAll();
        } else {
            licenses = repository.findByClinicId(currentUserService.getCurrentUserClinicId());
        }

        licenses.forEach(this::refreshStatus);
        return licenses;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClinicLicense> getLicenseById(@PathVariable Long id) {
        ClinicLicense license = repository.findById(id).orElse(null);
        if (license == null) {
            return ResponseEntity.notFound().build();
        }

        if (!currentUserService.isSuperAdmin()
                && !license.getClinicId().equals(currentUserService.getCurrentUserClinicId())) {
            return ResponseEntity.status(403).build();
        }

        refreshStatus(license);
        return ResponseEntity.ok(license);
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<?> renewLicense(@PathVariable Long id, @RequestBody ClinicLicense renewalData) {
        if (renewalData.getExpiryDate() == null || renewalData.getIssueDate() == null || !renewalData.getExpiryDate().isAfter(renewalData.getIssueDate())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Expiry date must be after issue date"));
        }

        ClinicLicense oldLicense = repository.findById(id).orElse(null);
        if (oldLicense == null) {
            return ResponseEntity.notFound().build();
        }

        if (!currentUserService.isSuperAdmin()
                && !oldLicense.getClinicId().equals(currentUserService.getCurrentUserClinicId())) {
            return ResponseEntity.status(403).build();
        }

        oldLicense.setStatus("Superseded");
        repository.save(oldLicense);

        ClinicLicense newLicense = new ClinicLicense();
        newLicense.setClinicId(oldLicense.getClinicId());
        newLicense.setLicenseType(oldLicense.getLicenseType());
        newLicense.setIssuingAuthority(oldLicense.getIssuingAuthority());
        newLicense.setLicenseNumber(renewalData.getLicenseNumber());
        newLicense.setIssueDate(renewalData.getIssueDate());
        newLicense.setExpiryDate(renewalData.getExpiryDate());
        newLicense.setDocumentUrl(renewalData.getDocumentUrl());
        newLicense.setStatus(computeStatus(renewalData.getExpiryDate()));
        newLicense.setRenewedFromId(oldLicense.getId());

        ClinicLicense saved = repository.save(newLicense);
        Map<String, Object> meta = new HashMap<>();
        meta.put("renewedFromId", oldLicense.getId());
        meta.put("licenseType", saved.getLicenseType());
        meta.put("licenseNumber", saved.getLicenseNumber());
        meta.put("expiryDate", saved.getExpiryDate() != null ? saved.getExpiryDate().toString() : null);
        meta.put("documentUrl", saved.getDocumentUrl());
        auditLogger.log("RENEWED", "clinic_license", saved.getId(), meta);
        return ResponseEntity.ok(saved);
    }

    // GET /api/clinic-licenses/summary - Super Admin only (enforced in SecurityConfig)
    // Doc B.4: cross-clinic counts PLUS a per-clinic drill-down table
    // (Clinic | Total Licenses | Worst Status | Next Expiry).
    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        List<ClinicLicense> all = repository.findAll();
        all.forEach(this::refreshStatus);

        List<ClinicLicense> current = all.stream().filter(l -> !"Superseded".equals(l.getStatus())).toList();

        long valid = current.stream().filter(l -> "Valid".equals(l.getStatus())).count();
        long renewalDue = current.stream().filter(l -> "Renewal Due Soon".equals(l.getStatus())).count();
        long urgent = current.stream().filter(l -> "Urgent".equals(l.getStatus())).count();
        long expired = current.stream().filter(l -> "Expired".equals(l.getStatus())).count();

        Map<String, List<ClinicLicense>> byClinic = current.stream()
                .collect(Collectors.groupingBy(ClinicLicense::getClinicId));

        List<Map<String, Object>> perClinic = new ArrayList<>();
        for (Map.Entry<String, List<ClinicLicense>> entry : byClinic.entrySet()) {
            List<ClinicLicense> clinicLicenses = entry.getValue();

            long expCount = clinicLicenses.stream().filter(l -> "Expired".equals(l.getStatus())).count();
            long urgCount = clinicLicenses.stream().filter(l -> "Urgent".equals(l.getStatus())).count();
            long renCount = clinicLicenses.stream().filter(l -> "Renewal Due Soon".equals(l.getStatus())).count();
            long valCount = clinicLicenses.stream().filter(l -> "Valid".equals(l.getStatus())).count();

            Map<String, Object> row = new HashMap<>();
            row.put("clinicId", entry.getKey());
            row.put("totalLicenses", clinicLicenses.size());
            row.put("expiredCount", expCount);
            row.put("urgentCount", urgCount);
            row.put("renewalDueCount", renCount);
            row.put("validCount", valCount);
            row.put("worstStatus", worstStatusOf(clinicLicenses));
            row.put("nextExpiry", clinicLicenses.stream()
                    .map(ClinicLicense::getExpiryDate)
                    .min(LocalDate::compareTo)
                    .orElse(null));
            perClinic.add(row);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("validCount", valid);
        summary.put("renewalDueCount", renewalDue);
        summary.put("urgentCount", urgent);
        summary.put("expiredCount", expired);
        summary.put("byClinic", perClinic);
        return summary;
    }

    private String worstStatusOf(List<ClinicLicense> licenses) {
        List<String> worstToBest = List.of("Expired", "Urgent", "Renewal Due Soon", "Valid");
        for (String level : worstToBest) {
            if (licenses.stream().anyMatch(l -> level.equals(l.getStatus()))) {
                return level;
            }
        }
        return "Valid";
    }

    // --- Notifications (doc B.2) ---
    // Runs automatically once a day. NOT doing email delivery - your doc says
    // "email added ... if delivery available", and there's no email/SMTP setup
    // in this POC, so this is in-app only (via the audit log) for now.
    @Scheduled(cron = "0 0 6 * * *")
    public void scheduledExpiryCheck() {
        checkExpiryNotifications();
    }

    // Manual trigger for testing - we can't wait a real day to see this work.
    // Left open to Clinic Admin/Super Admin (same as other license-management
    // actions), since it's a testing/ops convenience standing in for a cron job.
    @PostMapping("/check-expiry-notifications")
    public ResponseEntity<?> triggerExpiryCheck() {
        int notificationsFired = checkExpiryNotifications();
        return ResponseEntity.ok(Map.of("notificationsFired", notificationsFired));
    }

    private int checkExpiryNotifications() {
        int fired = 0;
        List<ClinicLicense> all = repository.findAll();

        for (ClinicLicense license : all) {
            if ("Superseded".equals(license.getStatus())) continue;

            long daysToExpiry = ChronoUnit.DAYS.between(LocalDate.now(), license.getExpiryDate());
            Integer newThreshold = null;
            if (daysToExpiry < 0) newThreshold = 0;
            else if (daysToExpiry <= 7) newThreshold = 7;
            else if (daysToExpiry <= 15) newThreshold = 15;
            else if (daysToExpiry <= 30) newThreshold = 30;

            if (newThreshold == null) continue;

            Integer lastNotified = license.getLastNotifiedThreshold();
            // Only fire if we've crossed into a NEW, more urgent threshold since
            // last time - this is exactly the "last_notified_threshold... to
            // avoid duplicates" rule from the doc.
            if (lastNotified == null || newThreshold < lastNotified) {
                auditLogger.logSystemAction("EXPIRY_NOTIFICATION_" + newThreshold + "_DAYS", "clinic_license", license.getId());
                license.setLastNotifiedThreshold(newThreshold);
                repository.save(license);
                fired++;
            }
        }
        return fired;
    }

    // In-app notification feed: just the notification-type entries from the
    // audit log, clinic-scoped the same way everything else is.
    @GetMapping("/notifications")
    public List<AuditLog> getNotifications() {
        List<AuditLog> notifications = auditLogRepository.findAll().stream()
                .filter(log -> log.getActionType() != null && log.getActionType().startsWith("EXPIRY_NOTIFICATION"))
                .toList();

        if (currentUserService.isSuperAdmin()) {
            return notifications;
        }

        List<Long> ownClinicLicenseIds = repository.findByClinicId(currentUserService.getCurrentUserClinicId())
                .stream().map(ClinicLicense::getId).toList();

        return notifications.stream()
                .filter(n -> ownClinicLicenseIds.contains(n.getEntityId()))
                .toList();
    }
}