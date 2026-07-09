package com.slashdr.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consent_templates")
public class ConsentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "procedure_type", nullable = false)
    private String procedureType;

    @Column(name = "form_body", nullable = false, columnDefinition = "TEXT")
    private String formBody;

    @Column(name = "requires_witness", nullable = false)
    private boolean requiresWitness = false;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProcedureType() {
        return procedureType;
    }

    public void setProcedureType(String procedureType) {
        this.procedureType = procedureType;
    }

    public String getFormBody() {
        return formBody;
    }

    public void setFormBody(String formBody) {
        this.formBody = formBody;
    }

    public boolean isRequiresWitness() {
        return requiresWitness;
    }

    public void setRequiresWitness(boolean requiresWitness) {
        this.requiresWitness = requiresWitness;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        this.isActive = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}