package com.slashdr.backend;

import com.slashdr.backend.entity.ConsentTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consent-templates")
public class ConsentTemplateController {

    @Autowired
    private ConsentTemplateRepository repository;

    @Autowired
    private AuditLogger auditLogger;

    @GetMapping
    public List<ConsentTemplate> getAllTemplates() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<ConsentTemplate> createTemplate(@RequestBody ConsentTemplate template) {
        ConsentTemplate savedTemplate = repository.save(template);
        auditLogger.log("CREATED", "consent_template", savedTemplate.getId());
        return ResponseEntity.ok(savedTemplate);
    }
}