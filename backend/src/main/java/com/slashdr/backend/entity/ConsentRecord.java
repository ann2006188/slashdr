package com.slashdr.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consent_records")
public class ConsentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "clinic_id", nullable = false, length = 50)
    private String clinicId;

    @Column(name = "patient_id", nullable = false, length = 50)
    private String patientId;

    @Column(name = "visit_id", nullable = false, length = 50)
    private String visitId;

    @Column(name = "filled_data_json", nullable = false, columnDefinition = "json")
    private String filledDataJson;

    @Column(name = "frozen_form_text", columnDefinition = "TEXT")
    private String frozenFormText;

    @Column(name = "patient_signature_url", length = 512)
    private String patientSignatureUrl;

    @Column(name = "witness_signature_url", length = 512)
    private String witnessSignatureUrl;

    @Column(name = "witness_name")
    private String witnessName;

    @Column(name = "risks_explained", nullable = false)
    private boolean risksExplained = false;

    @Column(name = "captured_by", nullable = false, length = 100)
    private String capturedBy;

    @Column(name = "captured_at", insertable = false, updatable = false)
    private LocalDateTime capturedAt;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "void_reason")
    private String voidReason;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getClinicId() {
        return clinicId;
    }

    public void setClinicId(String clinicId) {
        this.clinicId = clinicId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getVisitId() {
        return visitId;
    }

    public void setVisitId(String visitId) {
        this.visitId = visitId;
    }

    public String getFilledDataJson() {
        return filledDataJson;
    }

    public void setFilledDataJson(String filledDataJson) {
        this.filledDataJson = filledDataJson;
    }

    public String getFrozenFormText() {
        return frozenFormText;
    }

    public void setFrozenFormText(String frozenFormText) {
        this.frozenFormText = frozenFormText;
    }

    public String getPatientSignatureUrl() {
        return patientSignatureUrl;
    }

    public void setPatientSignatureUrl(String patientSignatureUrl) {
        this.patientSignatureUrl = patientSignatureUrl;
    }

    public String getWitnessSignatureUrl() {
        return witnessSignatureUrl;
    }

    public void setWitnessSignatureUrl(String witnessSignatureUrl) {
        this.witnessSignatureUrl = witnessSignatureUrl;
    }

    public String getWitnessName() {
        return witnessName;
    }

    public void setWitnessName(String witnessName) {
        this.witnessName = witnessName;
    }

    public boolean isRisksExplained() {
        return risksExplained;
    }

    public void setRisksExplained(boolean risksExplained) {
        this.risksExplained = risksExplained;
    }

    public String getCapturedBy() {
        return capturedBy;
    }

    public void setCapturedBy(String capturedBy) {
        this.capturedBy = capturedBy;
    }

    public LocalDateTime getCapturedAt() {
        return capturedAt;
    }

    public void setCapturedAt(LocalDateTime capturedAt) {
        this.capturedAt = capturedAt;
    }

    public LocalDateTime getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(LocalDateTime validUntil) {
        this.validUntil = validUntil;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getVoidReason() {
        return voidReason;
    }

    public void setVoidReason(String voidReason) {
        this.voidReason = voidReason;
    }
}