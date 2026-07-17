package com.slashdr.backend;

import com.slashdr.backend.entity.ClinicLicense;
import com.slashdr.backend.entity.ConsentRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    // Stored OUTSIDE src/main/resources/static - there is no direct web URL
    // that reaches this folder. The ONLY way to get a file back out is through
    // the GET endpoint below, which Spring Security already requires login for
    // (matches every other /api/** route) - that's what makes this "access-controlled"
    // rather than public static hosting.
    private static final String STORAGE_DIR = "uploads";

    private static final List<String> ALLOWED_EXTENSIONS = List.of("pdf", "jpg", "jpeg", "png");
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB

    @Autowired
    private AuditLogger auditLogger;

    @Autowired
    private ClinicLicenseRepository clinicLicenseRepository;

    @Autowired
    private ConsentRecordRepository consentRecordRepository;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            return ResponseEntity.badRequest().body(Map.of("error", "File exceeds 5MB limit"));
        }

        String originalName = file.getOriginalFilename();
        String extension = (originalName != null && originalName.contains("."))
                ? originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase()
                : "";

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF, JPG, and PNG files are allowed"));
        }

        try {
            Path storageDir = Paths.get(STORAGE_DIR);
            if (!Files.exists(storageDir)) {
                Files.createDirectories(storageDir);
            }

            // Random filename - never trust/reuse the original filename a user sent,
            // and this also makes the URL non-guessable on its own (defense in depth,
            // on top of the auth requirement).
            String storedFilename = UUID.randomUUID() + "." + extension;
            Path targetPath = storageDir.resolve(storedFilename);
            file.transferTo(targetPath);

            return ResponseEntity.ok(Map.of(
                    "documentId", storedFilename,
                    "url", "/api/documents/" + storedFilename
            ));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to save file"));
        }
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<Resource> getDocument(@PathVariable String documentId) {
        Path storageDir = Paths.get(STORAGE_DIR).toAbsolutePath().normalize();
        Path filePath = storageDir.resolve(documentId).normalize();

        // Blocks path-traversal tricks like "../../application.properties" -
        // the resolved path must still be inside our upload folder.
        if (!filePath.startsWith(storageDir)) {
            return ResponseEntity.badRequest().build();
        }

        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        // Log Document Viewed
        String docUrl = "/api/documents/" + documentId;
        Long entityId = 0L;
        String entityType = "document";

        List<ClinicLicense> licenses = clinicLicenseRepository.findAll().stream()
                .filter(l -> docUrl.equals(l.getDocumentUrl()))
                .toList();
        if (!licenses.isEmpty()) {
            entityId = licenses.get(0).getId();
            entityType = "clinic_license";
        } else {
            List<ConsentRecord> records = consentRecordRepository.findAll().stream()
                    .filter(r -> docUrl.equals(r.getPatientSignatureUrl()) || docUrl.equals(r.getWitnessSignatureUrl()))
                    .toList();
            if (!records.isEmpty()) {
                entityId = records.get(0).getId();
                entityType = "consent_record";
            }
        }
        auditLogger.log("VIEWED", entityType, entityId, Map.of("documentUrl", docUrl));

        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, determineContentType(documentId))
                .body(resource);
    }

    private String determineContentType(String filename) {
        if (filename.endsWith(".pdf")) return "application/pdf";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
        if (filename.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }
}