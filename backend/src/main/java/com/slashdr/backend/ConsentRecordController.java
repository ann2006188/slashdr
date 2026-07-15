package com.slashdr.backend;

import com.slashdr.backend.entity.ConsentRecord;
import com.slashdr.backend.entity.ConsentTemplate;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.scheduling.annotation.Scheduled;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consent-records")
public class ConsentRecordController {

    @Autowired
    private ConsentRecordRepository repository;

    @Autowired
    private ConsentTemplateRepository templateRepository;

    @Autowired
    private AuditLogger auditLogger;

    @Autowired
    private CurrentUserService currentUserService;

    @PostMapping
    public ResponseEntity<?> saveConsent(@RequestBody ConsentRecord record) {
        if (currentUserService.isSuperAdmin()) {
            if (record.getClinicId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "clinicId is required"));
            }
        } else {
            record.setClinicId(currentUserService.getCurrentUserClinicId());
        }

        boolean isDeclined = "declined".equals(record.getStatus());

        if (isDeclined) {
            if (record.getVoidReason() == null || record.getVoidReason().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "A reason is required when consent is declined"));
            }
            record.setStatus("declined");

        } else {
            if (record.getPatientSignatureUrl() == null || record.getPatientSignatureUrl().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Patient signature is required"));
            }

            if (!record.isRisksExplained()) {
                return ResponseEntity.badRequest().body(Map.of("error", "\"Risks Explained\" must be confirmed before submitting"));
            }

            if (record.getTemplateId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "templateId is required"));
            }

            ConsentTemplate template = templateRepository.findById(record.getTemplateId()).orElse(null);
            if (template == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "No template found with that templateId"));
            }

            if (!template.isActive()) {
                return ResponseEntity.badRequest().body(Map.of("error", "This template is inactive and cannot be used for new consents."));
            }

            if (template.isRequiresWitness()
                    && (record.getWitnessSignatureUrl() == null || record.getWitnessSignatureUrl().isBlank())) {
                return ResponseEntity.badRequest().body(Map.of("error", "This template requires a witness signature"));
            }

            record.setFrozenFormText(template.getFormBody());
            record.setStatus("active");
        }

        ConsentRecord saved = repository.save(record);
        auditLogger.log(isDeclined ? "DECLINED" : "CAPTURED", "consent_record", saved.getId());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/void")
    public ResponseEntity<?> voidRecord(@PathVariable Long id, @RequestBody Map<String, String> body) {
        ConsentRecord record = repository.findById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }

        if (!currentUserService.isSuperAdmin()
                && !record.getClinicId().equals(currentUserService.getCurrentUserClinicId())) {
            return ResponseEntity.status(403).build();
        }

        String reason = body.get("reason");
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "A reason is required to void a consent record"));
        }

        record.setStatus("void");
        record.setVoidReason(reason);
        ConsentRecord saved = repository.save(record);
        auditLogger.log("VOIDED", "consent_record", saved.getId());
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<ConsentRecord> getRecords(
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String procedureType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String capturedBy) {
        return filterRecords(patientId, dateFrom, dateTo, procedureType, status, capturedBy);
    }

    // Shared by both the JSON search endpoint above and the CSV export below,
    // so "what you see in the register" and "what you download" always match.
    private List<ConsentRecord> filterRecords(String patientId, String dateFrom, String dateTo,
                                               String procedureType, String status, String capturedBy) {
        List<ConsentRecord> records = currentUserService.isSuperAdmin()
                ? repository.findAll()
                : repository.findByClinicId(currentUserService.getCurrentUserClinicId());

        if (patientId != null) {
            records = records.stream().filter(r -> patientId.equals(r.getPatientId())).toList();
        }
        if (status != null) {
            records = records.stream().filter(r -> status.equals(r.getStatus())).toList();
        }
        if (capturedBy != null) {
            records = records.stream().filter(r -> capturedBy.equals(r.getCapturedBy())).toList();
        }
        if (dateFrom != null) {
            LocalDate from = LocalDate.parse(dateFrom);
            records = records.stream()
                    .filter(r -> r.getCapturedAt() != null && !r.getCapturedAt().toLocalDate().isBefore(from))
                    .toList();
        }
        if (dateTo != null) {
            LocalDate to = LocalDate.parse(dateTo);
            records = records.stream()
                    .filter(r -> r.getCapturedAt() != null && !r.getCapturedAt().toLocalDate().isAfter(to))
                    .toList();
        }
        if (procedureType != null) {
            List<Long> matchingTemplateIds = templateRepository.findAll().stream()
                    .filter(t -> procedureType.equals(t.getProcedureType()))
                    .map(ConsentTemplate::getId)
                    .toList();
            records = records.stream().filter(r -> matchingTemplateIds.contains(r.getTemplateId())).toList();
        }

        return records;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConsentRecord> getRecordById(@PathVariable Long id) {
        ConsentRecord record = repository.findById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }
        if (!currentUserService.isSuperAdmin()
                && !record.getClinicId().equals(currentUserService.getCurrentUserClinicId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(record);
    }

    // --- Export: single record -> PDF (doc A.3) ---
    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportRecordAsPdf(@PathVariable Long id) throws IOException {
        ConsentRecord record = repository.findById(id).orElse(null);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }
        if (!currentUserService.isSuperAdmin()
                && !record.getClinicId().equals(currentUserService.getCurrentUserClinicId())) {
            return ResponseEntity.status(403).build();
        }

        byte[] pdfBytes = buildConsentPdf(record);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=consent-record-" + id + ".pdf")
                .body(pdfBytes);
    }

    private byte[] buildConsentPdf(ConsentRecord record) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);

            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font boldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float margin = 50;
                float leading = 16f;
                float y = page.getMediaBox().getHeight() - margin;

                content.beginText();
                content.setFont(boldFont, 16);
                content.newLineAtOffset(margin, y);
                content.showText("Consent Record #" + record.getId());
                content.endText();
                y -= leading * 2;

                String[] lines = {
                        "Patient ID: " + orNA(record.getPatientId()),
                        "Visit ID: " + orNA(record.getVisitId()),
                        "Clinic ID: " + orNA(record.getClinicId()),
                        "Status: " + orNA(record.getStatus()),
                        "Captured By: " + orNA(record.getCapturedBy()),
                        "Captured At: " + (record.getCapturedAt() != null ? record.getCapturedAt().toString() : "N/A"),
                        "Witness Name: " + orNA(record.getWitnessName())
                };

                content.setFont(font, 11);
                for (String line : lines) {
                    content.beginText();
                    content.newLineAtOffset(margin, y);
                    content.showText(line);
                    content.endText();
                    y -= leading;
                }

                y -= leading / 2;
                content.setFont(boldFont, 12);
                content.beginText();
                content.newLineAtOffset(margin, y);
                content.showText("Consent Text (as agreed to at signing time):");
                content.endText();
                y -= leading;

                content.setFont(font, 10);
                String formText = record.getFrozenFormText() != null ? record.getFrozenFormText() : "(not recorded)";
                // Simple POC limitation: text wraps to fit the page width, but very
                // long consent text isn't paginated onto a second page - fine for
                // typical consent form lengths, would need more work for long documents.
                for (String wrapped : wrapText(formText, 95)) {
                    if (y < margin) break;
                    content.beginText();
                    content.newLineAtOffset(margin, y);
                    content.showText(wrapped);
                    content.endText();
                    y -= leading;
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    private String orNA(String s) {
        return (s != null && !s.isBlank()) ? s : "N/A";
    }

    private List<String> wrapText(String text, int maxCharsPerLine) {
        List<String> lines = new ArrayList<>();
        String[] words = text.split("\\s+");
        StringBuilder current = new StringBuilder();
        for (String word : words) {
            if (current.length() + word.length() + 1 > maxCharsPerLine) {
                lines.add(current.toString());
                current = new StringBuilder();
            }
            if (current.length() > 0) current.append(" ");
            current.append(word);
        }
        if (current.length() > 0) lines.add(current.toString());
        return lines;
    }

    // --- Export: filtered register -> CSV (doc A.3) ---
    // Same filters as the search endpoint above.
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportRegisterAsCsv(
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String procedureType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String capturedBy) {

        List<ConsentRecord> records = filterRecords(patientId, dateFrom, dateTo, procedureType, status, capturedBy);

        StringBuilder csv = new StringBuilder();
        csv.append("ID,Patient ID,Visit ID,Status,Captured By,Captured At,Witness Name\n");
        for (ConsentRecord r : records) {
            csv.append(r.getId()).append(",")
                    .append(csvEscape(r.getPatientId())).append(",")
                    .append(csvEscape(r.getVisitId())).append(",")
                    .append(csvEscape(r.getStatus())).append(",")
                    .append(csvEscape(r.getCapturedBy())).append(",")
                    .append(r.getCapturedAt() != null ? r.getCapturedAt().toString() : "").append(",")
                    .append(csvEscape(r.getWitnessName())).append("\n");
        }

        byte[] csvBytes = csv.toString().getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/csv")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=consent-register.csv")
                .body(csvBytes);
    }

    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    @Scheduled(cron = "0 0 6 * * *")
    public void scheduledConsentExpiryCheck() {
        checkConsentExpiry();
    }

    @PostMapping("/check-expiry")
    public ResponseEntity<?> triggerConsentExpiry() {
        int expiredCount = checkConsentExpiry();
        return ResponseEntity.ok(Map.of("expiredCount", expiredCount));
    }

    private int checkConsentExpiry() {
        int expiredCount = 0;
        List<ConsentRecord> all = repository.findAll();
        LocalDateTime now = LocalDateTime.now();
        for (ConsentRecord record : all) {
            if ("active".equals(record.getStatus()) && record.getValidUntil() != null && record.getValidUntil().isBefore(now)) {
                record.setStatus("expired");
                repository.save(record);
                auditLogger.log("EXPIRED", "consent_record", record.getId());
                expiredCount++;
            }
        }
        return expiredCount;
    }
}