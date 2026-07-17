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
        java.util.Map<String, Object> meta = java.util.Map.of(
                "templateName", savedTemplate.getName(),
                "procedureType", savedTemplate.getProcedureType(),
                "requiresWitness", savedTemplate.isRequiresWitness()
        );
        auditLogger.log("CREATED", "consent_template", savedTemplate.getId(), meta);
        return ResponseEntity.ok(savedTemplate);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTemplate(@PathVariable Long id, @RequestBody ConsentTemplate templateDetails) {
        ConsentTemplate existing = repository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        existing.setName(templateDetails.getName());
        existing.setProcedureType(templateDetails.getProcedureType());
        existing.setFormBody(templateDetails.getFormBody());
        existing.setRequiresWitness(templateDetails.isRequiresWitness());
        existing.setActive(templateDetails.isActive());
        
        ConsentTemplate saved = repository.save(existing);
        java.util.Map<String, Object> meta = java.util.Map.of(
                "templateName", saved.getName(),
                "procedureType", saved.getProcedureType(),
                "requiresWitness", saved.isRequiresWitness()
        );
        auditLogger.log("EDITED", "consent_template", saved.getId(), meta);
        return ResponseEntity.ok(saved);
    }
}