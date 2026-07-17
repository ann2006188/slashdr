package com.slashdr.backend;

import com.slashdr.backend.entity.ClinicLicense;
import com.slashdr.backend.entity.ConsentTemplate;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import com.slashdr.backend.entity.AppUser;
import com.slashdr.backend.entity.ConsentRecord;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private ClinicLicenseRepository repository;

    @Autowired
    private ConsentTemplateRepository templateRepository;

    @Autowired
    private AppUserRepository userRepository;

    @Autowired
    private ConsentRecordRepository consentRecordRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Generate unique PDF certificate files inside the uploads folder on startup
        generateSeededPdfs();

        // Clear existing licenses and recreate relative to today's date
        repository.deleteAll();
        seedLicenses();
        seedTemplates();
        seedUsers();
        migrateExistingConsentRecords();
    }

    private void generateSeededPdfs() {
        LocalDate today = LocalDate.now();
        generateDummyPdf("cel-c1.pdf", "Clinical Establishment License", "clinic-001", "CEL-2026-001", "State Health Department", today.minusDays(365), today.plusDays(45));
        generateDummyPdf("fsc-c1.pdf", "Fire Safety Certificate", "clinic-001", "FSC-2026-014", "Fire and Rescue Services", today.minusDays(180), today.plusDays(15));
        generateDummyPdf("bmw-c1.pdf", "Biomedical Waste Authorization", "clinic-001", "BMW-2026-003", "Pollution Control Board", today.minusDays(365), today.minusDays(10));
        generateDummyPdf("ph-c1.pdf", "Pharmacy License", "clinic-001", "PH-2025-114", "State Drug Control Department", today.minusDays(730), today.minusDays(365));
        generateDummyPdf("cel-c2.pdf", "Clinical Establishment License", "clinic-002", "CEL-2026-002", "State Health Department", today.minusDays(300), today.plusDays(35));
        generateDummyPdf("fsc-c2.pdf", "Fire Safety Certificate", "clinic-002", "FSC-2026-022", "Fire and Rescue Services", today.minusDays(90), today.plusDays(3));
        generateDummyPdf("cel-c3.pdf", "Clinical Establishment License", "clinic-003", "CEL-2026-003", "State Health Department", today.minusDays(120), today.plusDays(50));
        generateDummyPdf("bmw-c3.pdf", "Biomedical Waste Authorization", "clinic-003", "BMW-2026-009", "Pollution Control Board", today.minusDays(365), today.minusDays(2));
    }

    private String getClinicName(String clinicId) {
        if ("clinic-001".equalsIgnoreCase(clinicId)) return "Sunrise Medical Centre";
        if ("clinic-002".equalsIgnoreCase(clinicId)) return "Horizon Healthcare";
        if ("clinic-003".equalsIgnoreCase(clinicId)) return "Apex Medical Group";
        return "General Clinic";
    }

    private void generateDummyPdf(String filename, String title, String clinicId, String licenseNumber, String issuingAuthority, LocalDate issueDate, LocalDate expiryDate) {
        Path storageDir = Paths.get("uploads");
        try {
            if (!Files.exists(storageDir)) {
                Files.createDirectories(storageDir);
            }
            Path filePath = storageDir.resolve(filename);
            
            // Delete existing files to force regenerate on design/data updates
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
            
            try (PDDocument document = new PDDocument()) {
                PDPage page = new PDPage(PDRectangle.LETTER);
                document.addPage(page);
                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    
                    // 1. Draw elegant double border in dark goldenrod (Bronze/Gold)
                    content.setStrokingColor(new java.awt.Color(184, 134, 11));
                    content.setLineWidth(3);
                    content.addRect(30, 30, 552, 732);
                    content.stroke();

                    content.setLineWidth(1);
                    content.addRect(36, 36, 540, 720);
                    content.stroke();

                    // 2. Header Authority
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                    content.setNonStrokingColor(new java.awt.Color(26, 54, 93)); // Dark Navy Blue (#1A365D)
                    content.newLineAtOffset(140, 710);
                    content.showText("HEALTH & COMPLIANCE REGULATORY AUTHORITY");
                    content.endText();

                    // Gold decorative line below header
                    content.setStrokingColor(new java.awt.Color(184, 134, 11));
                    content.setLineWidth(1.5f);
                    content.moveTo(50, 690);
                    content.lineTo(562, 690);
                    content.stroke();

                    // 3. Certificate Title
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 20);
                    content.setNonStrokingColor(new java.awt.Color(26, 54, 93));
                    content.newLineAtOffset(160, 650);
                    content.showText("CERTIFICATE OF LICENSURE");
                    content.endText();

                    // Statement
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE), 11);
                    content.setNonStrokingColor(new java.awt.Color(74, 85, 104)); // Charcoal Grey
                    content.newLineAtOffset(120, 620);
                    content.showText("This certifies that the medical facility listed below is fully compliant");
                    content.endText();
                    
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE), 11);
                    content.setNonStrokingColor(new java.awt.Color(74, 85, 104));
                    content.newLineAtOffset(150, 605);
                    content.showText("with all applicable state and local healthcare standards.");
                    content.endText();

                    // 4. Details container box
                    content.setStrokingColor(new java.awt.Color(226, 232, 240)); // Light Grey Border
                    content.setLineWidth(1);
                    content.addRect(60, 310, 492, 260);
                    content.stroke();

                    String clinicName = getClinicName(clinicId);

                    // Row 1: Clinic Name
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                    content.setNonStrokingColor(new java.awt.Color(26, 54, 93));
                    content.newLineAtOffset(80, 540);
                    content.showText("FACILITY NAME:");
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    content.setNonStrokingColor(new java.awt.Color(45, 55, 72));
                    content.newLineAtOffset(160, 0);
                    content.showText(clinicName);
                    content.endText();

                    // Row 2: Clinic ID
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                    content.setNonStrokingColor(new java.awt.Color(26, 54, 93));
                    content.newLineAtOffset(80, 500);
                    content.showText("FACILITY ID:");
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    content.setNonStrokingColor(new java.awt.Color(45, 55, 72));
                    content.newLineAtOffset(160, 0);
                    content.showText(clinicId.toUpperCase());
                    content.endText();

                    // Row 3: License Type
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                    content.setNonStrokingColor(new java.awt.Color(26, 54, 93));
                    content.newLineAtOffset(80, 460);
                    content.showText("LICENSE TYPE:");
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    content.setNonStrokingColor(new java.awt.Color(45, 55, 72));
                    content.newLineAtOffset(160, 0);
                    content.showText(title);
                    content.endText();

                    // Row 4: License Number
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                    content.setNonStrokingColor(new java.awt.Color(26, 54, 93));
                    content.newLineAtOffset(80, 420);
                    content.showText("LICENSE NO:");
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    content.setNonStrokingColor(new java.awt.Color(45, 55, 72));
                    content.newLineAtOffset(160, 0);
                    content.showText(licenseNumber);
                    content.endText();

                    // Row 5: Issuing Authority
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                    content.setNonStrokingColor(new java.awt.Color(26, 54, 93));
                    content.newLineAtOffset(80, 380);
                    content.showText("AUTHORITY:");
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    content.setNonStrokingColor(new java.awt.Color(45, 55, 72));
                    content.newLineAtOffset(160, 0);
                    content.showText(issuingAuthority);
                    content.endText();

                    // Row 6: Issue and Expiry Dates
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
                    content.setNonStrokingColor(new java.awt.Color(26, 54, 93));
                    content.newLineAtOffset(80, 340);
                    content.showText("ISSUE DATE:");
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                    content.setNonStrokingColor(new java.awt.Color(45, 55, 72));
                    content.newLineAtOffset(90, 0);
                    content.showText(issueDate.toString());
                    content.endText();

                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
                    content.setNonStrokingColor(new java.awt.Color(26, 54, 93));
                    content.newLineAtOffset(320, 340);
                    content.showText("EXPIRY DATE:");
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                    content.setNonStrokingColor(new java.awt.Color(45, 55, 72));
                    content.newLineAtOffset(90, 0);
                    content.showText(expiryDate.toString());
                    content.endText();

                    // 5. Seal & Signature blocks
                    // Gold color shield
                    content.setStrokingColor(new java.awt.Color(218, 165, 32)); 
                    content.setNonStrokingColor(new java.awt.Color(250, 240, 202)); // Light Golden Sand
                    content.setLineWidth(2);
                    
                    float sx = 140;
                    float sy = 180;
                    content.moveTo(sx, sy + 30);
                    content.lineTo(sx + 25, sy + 15);
                    content.lineTo(sx + 25, sy - 20);
                    content.lineTo(sx, sy - 35);
                    content.lineTo(sx - 25, sy - 20);
                    content.lineTo(sx - 25, sy + 15);
                    content.closePath();
                    content.fillAndStroke();

                    // Label inside the seal
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 8);
                    content.setNonStrokingColor(new java.awt.Color(184, 134, 11));
                    content.newLineAtOffset(sx - 23, sy - 3);
                    content.showText("APPROVED");
                    content.endText();

                    // Signature line
                    content.setStrokingColor(new java.awt.Color(74, 85, 104));
                    content.setLineWidth(1);
                    content.moveTo(380, 170);
                    content.lineTo(500, 170);
                    content.stroke();

                    // Signature text
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                    content.setNonStrokingColor(new java.awt.Color(26, 54, 93));
                    content.newLineAtOffset(380, 155);
                    content.showText("Compliance Director");
                    content.endText();

                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8);
                    content.setNonStrokingColor(new java.awt.Color(113, 128, 150));
                    content.newLineAtOffset(380, 142);
                    content.showText("State Licensing Board");
                    content.endText();

                    // 6. Footer metadata
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8);
                    content.setNonStrokingColor(new java.awt.Color(160, 174, 192));
                    content.newLineAtOffset(60, 60);
                    content.showText("Certificate ID: " + java.util.UUID.nameUUIDFromBytes(licenseNumber.getBytes()).toString().substring(0, 8).toUpperCase());
                    content.endText();

                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8);
                    content.setNonStrokingColor(new java.awt.Color(160, 174, 192));
                    content.newLineAtOffset(380, 60);
                    content.showText("Generated: " + LocalDate.now().toString() + " | SlashDR Compliance Hub");
                    content.endText();
                }
                document.save(filePath.toFile());
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void seedLicenses() {
        LocalDate today = LocalDate.now();

        // Clinic 1 (CLINIC-001)
        ClinicLicense l1 = new ClinicLicense();
        l1.setClinicId("clinic-001");
        l1.setLicenseType("Clinical Establishment License");
        l1.setLicenseNumber("CEL-2026-001");
        l1.setIssuingAuthority("State Health Department");
        l1.setIssueDate(today.minusDays(365));
        l1.setExpiryDate(today.plusDays(45)); // > 30 days -> Valid (Green)
        l1.setStatus("Valid");
        l1.setDocumentUrl("/api/documents/cel-c1.pdf");

        ClinicLicense l2 = new ClinicLicense();
        l2.setClinicId("clinic-001");
        l2.setLicenseType("Fire Safety Certificate");
        l2.setLicenseNumber("FSC-2026-014");
        l2.setIssuingAuthority("Fire and Rescue Services");
        l2.setIssueDate(today.minusDays(180));
        l2.setExpiryDate(today.plusDays(15)); // 8-30 days -> Renewal Due Soon (Amber)
        l2.setStatus("Renewal Due Soon");
        l2.setDocumentUrl("/api/documents/fsc-c1.pdf");

        ClinicLicense l3 = new ClinicLicense();
        l3.setClinicId("clinic-001");
        l3.setLicenseType("Biomedical Waste Authorization");
        l3.setLicenseNumber("BMW-2026-003");
        l3.setIssuingAuthority("Pollution Control Board");
        l3.setIssueDate(today.minusDays(365));
        l3.setExpiryDate(today.minusDays(10)); // < 0 days -> Expired (Red/Dark)
        l3.setStatus("Expired");
        l3.setDocumentUrl("/api/documents/bmw-c1.pdf");

        ClinicLicense l4 = new ClinicLicense();
        l4.setClinicId("clinic-001");
        l4.setLicenseType("Pharmacy License");
        l4.setLicenseNumber("PH-2025-114");
        l4.setIssuingAuthority("State Drug Control Department");
        l4.setIssueDate(today.minusDays(730));
        l4.setExpiryDate(today.minusDays(365)); // Superseded
        l4.setStatus("Superseded");
        l4.setDocumentUrl("/api/documents/ph-c1.pdf");

        // Clinic 2 (CLINIC-002)
        ClinicLicense l5 = new ClinicLicense();
        l5.setClinicId("clinic-002");
        l5.setLicenseType("Clinical Establishment License");
        l5.setLicenseNumber("CEL-2026-002");
        l5.setIssuingAuthority("State Health Department");
        l5.setIssueDate(today.minusDays(300));
        l5.setExpiryDate(today.plusDays(35)); // > 30 days -> Valid (Green)
        l5.setStatus("Valid");
        l5.setDocumentUrl("/api/documents/cel-c2.pdf");

        ClinicLicense l6 = new ClinicLicense();
        l6.setClinicId("clinic-002");
        l6.setLicenseType("Fire Safety Certificate");
        l6.setLicenseNumber("FSC-2026-022");
        l6.setIssuingAuthority("Fire and Rescue Services");
        l6.setIssueDate(today.minusDays(90));
        l6.setExpiryDate(today.plusDays(3)); // 0-7 days -> Urgent (Red)
        l6.setStatus("Urgent");
        l6.setDocumentUrl("/api/documents/fsc-c2.pdf");

        // Clinic 3 (CLINIC-003)
        ClinicLicense l7 = new ClinicLicense();
        l7.setClinicId("clinic-003");
        l7.setLicenseType("Clinical Establishment License");
        l7.setLicenseNumber("CEL-2026-003");
        l7.setIssuingAuthority("State Health Department");
        l7.setIssueDate(today.minusDays(120));
        l7.setExpiryDate(today.plusDays(50)); // > 30 days -> Valid (Green)
        l7.setStatus("Valid");
        l7.setDocumentUrl("/api/documents/cel-c3.pdf");

        ClinicLicense l8 = new ClinicLicense();
        l8.setClinicId("clinic-003");
        l8.setLicenseType("Biomedical Waste Authorization");
        l8.setLicenseNumber("BMW-2026-009");
        l8.setIssuingAuthority("Pollution Control Board");
        l8.setIssueDate(today.minusDays(365));
        l8.setExpiryDate(today.minusDays(2)); // < 0 days -> Expired (Red/Dark)
        l8.setStatus("Expired");
        l8.setDocumentUrl("/api/documents/bmw-c3.pdf");

        repository.saveAll(List.of(l1, l2, l3, l4, l5, l6, l7, l8));
    }

    private void seedTemplates() {
        updateOrCreateTemplate(1L, "General Surgical Consent", "Surgical", 
            "I, [Patient Name], aged [Age], Gender [Gender], voluntarily consent to undergo [Procedure Name] after the procedure, benefits, risks, and alternatives have been explained to me by Dr. [Doctor Name]. I acknowledge that the risks have been explained to me and I voluntarily provide my consent.", true);
        
        updateOrCreateTemplate(2L, "Blood Transfusion Consent", "Blood Transfusion", 
            "I, [Patient Name], aged [Age], Gender [Gender], understand the benefits, risks, possible reactions and available alternatives related to blood transfusion of [Procedure Name] and voluntarily consent to receive blood products if medically necessary as prescribed by Dr. [Doctor Name].", true);
        
        updateOrCreateTemplate(3L, "General Anaesthesia Consent", "Anesthesia", 
            "I, [Patient Name], aged [Age], Gender [Gender], understand the anaesthesia procedure [Procedure Name], its benefits, associated risks and possible complications as explained by Dr. [Doctor Name]. All my questions have been answered.", true);
        
        updateOrCreateTemplate(4L, "MRI Contrast Consent", "Other", 
            "I, [Patient Name], aged [Age], Gender [Gender], understand that contrast dye will be administered during the MRI procedure [Procedure Name] and acknowledge the explained risks and precautions as explained by Dr. [Doctor Name].", false);
    }

    private void updateOrCreateTemplate(Long id, String name, String type, String body, boolean requiresWitness) {
        ConsentTemplate t = templateRepository.findById(id).orElse(new ConsentTemplate());
        if (t.getId() == null) {
            t.setId(id);
        }
        t.setName(name);
        t.setProcedureType(type);
        t.setFormBody(body);
        t.setRequiresWitness(requiresWitness);
        t.setActive(true);
        templateRepository.save(t);
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            AppUser staff = new AppUser();
            staff.setFullName("Support Staff");
            staff.setUsername("staff1");
            staff.setPassword(passwordEncoder.encode("staff123"));
            staff.setRole("ROLE_STAFF");
            staff.setClinicId("clinic-001");
            staff.setActive(true);
            userRepository.save(staff);

            AppUser doctor = new AppUser();
            doctor.setFullName("Dr. Alex Stone");
            doctor.setUsername("doctor1");
            doctor.setPassword(passwordEncoder.encode("doctor123"));
            doctor.setRole("ROLE_DOCTOR");
            doctor.setClinicId("clinic-001");
            doctor.setActive(true);
            userRepository.save(doctor);

            AppUser admin1 = new AppUser();
            admin1.setFullName("Clinic Administrator");
            admin1.setUsername("admin1");
            admin1.setPassword(passwordEncoder.encode("admin123"));
            admin1.setRole("ROLE_CLINIC_ADMIN");
            admin1.setClinicId("clinic-001");
            admin1.setActive(true);
            userRepository.save(admin1);

            AppUser admin2 = new AppUser();
            admin2.setFullName("Second Clinic Admin");
            admin2.setUsername("admin2");
            admin2.setPassword(passwordEncoder.encode("admin123"));
            admin2.setRole("ROLE_CLINIC_ADMIN");
            admin2.setClinicId("clinic-002");
            admin2.setActive(true);
            userRepository.save(admin2);

            AppUser superadmin = new AppUser();
            superadmin.setFullName("SlashDR Super Admin");
            superadmin.setUsername("superadmin1");
            superadmin.setPassword(passwordEncoder.encode("super123"));
            superadmin.setRole("ROLE_SUPER_ADMIN");
            superadmin.setClinicId(null);
            superadmin.setActive(true);
            userRepository.save(superadmin);
        }
    }

    private void migrateExistingConsentRecords() {
        List<ConsentRecord> records = consentRecordRepository.findAll();
        for (ConsentRecord record : records) {
            String text = record.getFrozenFormText();
            String filledDataJson = record.getFilledDataJson();

            // Populate empty filledDataJson if placeholders are found in the text
            if ((filledDataJson == null || filledDataJson.isBlank() || filledDataJson.equals("{}")) && text != null && text.contains("[")) {
                filledDataJson = "{\"Patient Name\":\"Rohan Sharma\",\"Age\":\"35\",\"Gender\":\"Male\",\"Procedure Name\":\"Brain MRI Scan\",\"Doctor Name\":\"Dr. Aditi Joshi\"}";
                record.setFilledDataJson(filledDataJson);
                consentRecordRepository.save(record);
            }

            if (filledDataJson != null && !filledDataJson.isBlank()) {
                if (text == null || text.isBlank()) {
                    ConsentTemplate template = templateRepository.findById(record.getTemplateId()).orElse(null);
                    if (template != null) {
                        text = template.getFormBody();
                    }
                }
                if (text != null && text.contains("[")) {
                    String resolved = resolvePlaceholders(text, filledDataJson);
                    record.setFrozenFormText(resolved);
                    consentRecordRepository.save(record);
                }
            }
        }
    }

    private String resolvePlaceholders(String body, String filledDataJson) {
        try {
            java.util.Map<String, String> filledMap = new java.util.HashMap<>();
            java.util.regex.Pattern jsonPattern = java.util.regex.Pattern.compile("\"([^\"]+)\"\\s*:\\s*(?:\"([^\"]*)\"|([^,}\\s]+))");
            java.util.regex.Matcher jsonMatcher = jsonPattern.matcher(filledDataJson);
            while (jsonMatcher.find()) {
                String key = jsonMatcher.group(1);
                String value = jsonMatcher.group(2) != null ? jsonMatcher.group(2) : jsonMatcher.group(3);
                if (key != null && value != null) {
                    String normKey = key.replaceAll("\\s+", "").toLowerCase();
                    filledMap.put(normKey, value);
                }
            }

            java.util.regex.Pattern placeholderPattern = java.util.regex.Pattern.compile("\\[([^\\]]+)\\]");
            java.util.regex.Matcher placeholderMatcher = placeholderPattern.matcher(body);
            StringBuffer sb = new StringBuffer();
            while (placeholderMatcher.find()) {
                String originalPlaceholder = placeholderMatcher.group(0);
                String innerContent = placeholderMatcher.group(1);
                String normContent = innerContent.replaceAll("\\s+", "").toLowerCase();

                if (filledMap.containsKey(normContent)) {
                    placeholderMatcher.appendReplacement(sb, java.util.regex.Matcher.quoteReplacement(filledMap.get(normContent)));
                } else {
                    placeholderMatcher.appendReplacement(sb, java.util.regex.Matcher.quoteReplacement(originalPlaceholder));
                }
            }
            placeholderMatcher.appendTail(sb);
            return sb.toString();
        } catch (Exception e) {
            return body;
        }
    }
}
