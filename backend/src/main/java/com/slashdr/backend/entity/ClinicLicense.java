package com.slashdr.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "clinic_licenses")
public class ClinicLicense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinic_id", nullable = false, length = 50)
    private String clinicId;

    @Column(name = "license_type", nullable = false)
    private String licenseType;

    @Column(name = "license_number", nullable = false, length = 100)
    private String licenseNumber;

    @Column(name = "issuing_authority", nullable = false)
    private String issuingAuthority;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "document_url", nullable = false, length = 512)
    private String documentUrl;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "last_notified_threshold")
    private Integer lastNotifiedThreshold;

    @Transient
    private Boolean duplicateWarning;

    @Column(name = "renewed_from_id")
    private Long renewedFromId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClinicId() {
        return clinicId;
    }

    public void setClinicId(String clinicId) {
        this.clinicId = clinicId;
    }

    public String getLicenseType() {
        return licenseType;
    }

    public void setLicenseType(String licenseType) {
        this.licenseType = licenseType;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public String getIssuingAuthority() {
        return issuingAuthority;
    }

    public void setIssuingAuthority(String issuingAuthority) {
        this.issuingAuthority = issuingAuthority;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getDocumentUrl() {
        return documentUrl;
    }

    public void setDocumentUrl(String documentUrl) {
        this.documentUrl = documentUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getLastNotifiedThreshold() {
        return lastNotifiedThreshold;
    }

    public void setLastNotifiedThreshold(Integer lastNotifiedThreshold) {
        this.lastNotifiedThreshold = lastNotifiedThreshold;
    }

    public Boolean getDuplicateWarning() {
        return duplicateWarning;
    }

    public void setDuplicateWarning(Boolean duplicateWarning) {
        this.duplicateWarning = duplicateWarning;
    }

    public Long getRenewedFromId() {
        return renewedFromId;
    }

    public void setRenewedFromId(Long renewedFromId) {
        this.renewedFromId = renewedFromId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}