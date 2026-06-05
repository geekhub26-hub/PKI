package cm.gov.pki.entity;

import jakarta.persistence.*;
// Lombok supprimé : constructeurs, getters, setters générés manuellement
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "certificate_requests", indexes = {
    @Index(name = "idx_certificate_requests_user_id", columnList = "user_id"),
    @Index(name = "idx_certificate_requests_status", columnList = "status"),
    @Index(name = "idx_certificate_requests_submitted_at", columnList = "submitted_at")
})
@EntityListeners(AuditingEntityListener.class)
// Lombok annotations supprimées
public class CertificateRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "common_name", nullable = false)
    private String commonName;

    @Column(name = "organization")
    private String organization;

    @Column(name = "organizational_unit")
    private String organizationalUnit;

    @Column(name = "locality")
    private String locality;

    @Column(name = "state")
    private String state;

    @Column(name = "country", length = 2)
    private String country;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "birth_date")
    private java.time.LocalDate birthDate;

    @Column(name = "birth_place")
    private String birthPlace;

    @Column(name = "nationality", length = 2)
    private String nationality;

    @Column(name = "identity_document_type", length = 50)
    private String identityDocumentType;

    @Column(name = "identity_document_number")
    private String identityDocumentNumber;

    @Column(name = "identity_document_expiry")
    private java.time.LocalDate identityDocumentExpiry;

    @Column(name = "status", length = 50)
    private String status = "PENDING";

    @Column(name = "csr_content", columnDefinition = "TEXT")
    private String csrContent;

    @Column(name = "server_private_key_pem", columnDefinition = "TEXT")
    private String serverPrivateKeyPem;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "validation_token")
    private String validationToken;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Column(name = "token_used_at")
    private LocalDateTime tokenUsedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Liste des fichiers joints (JSON ou CSV) enregistrés côté serveur
    @Column(name = "documents", columnDefinition = "TEXT")
    private String documents;
    @Column(name = "created_at", updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    // --- Constructeurs ---
    public CertificateRequest() {
        // Constructeur sans argument
    }

    public CertificateRequest(UUID id, User user, String commonName, String organization, String organizationalUnit,
                              String locality, String state, String country, String email, String status, String csrContent,
                              LocalDateTime submittedAt, LocalDateTime reviewedAt, User reviewedBy, String validationToken,
                              LocalDateTime tokenExpiresAt, LocalDateTime tokenUsedAt, String rejectionReason, String notes,
                              LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.user = user;
        this.commonName = commonName;
        this.organization = organization;
        this.organizationalUnit = organizationalUnit;
        this.locality = locality;
        this.state = state;
        this.country = country;
        this.email = email;
        this.status = status;
        this.csrContent = csrContent;
        this.submittedAt = submittedAt;
        this.reviewedAt = reviewedAt;
        this.reviewedBy = reviewedBy;
        this.validationToken = validationToken;
        this.tokenExpiresAt = tokenExpiresAt;
        this.tokenUsedAt = tokenUsedAt;
        this.rejectionReason = rejectionReason;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // --- Getters et Setters ---
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getCommonName() { return commonName; }
    public void setCommonName(String commonName) { this.commonName = commonName; }

    public String getOrganization() { return organization; }
    public void setOrganization(String organization) { this.organization = organization; }

    public String getOrganizationalUnit() { return organizationalUnit; }
    public void setOrganizationalUnit(String organizationalUnit) { this.organizationalUnit = organizationalUnit; }

    public String getLocality() { return locality; }
    public void setLocality(String locality) { this.locality = locality; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public java.time.LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(java.time.LocalDate birthDate) { this.birthDate = birthDate; }

    public String getBirthPlace() { return birthPlace; }
    public void setBirthPlace(String birthPlace) { this.birthPlace = birthPlace; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getIdentityDocumentType() { return identityDocumentType; }
    public void setIdentityDocumentType(String identityDocumentType) { this.identityDocumentType = identityDocumentType; }

    public String getIdentityDocumentNumber() { return identityDocumentNumber; }
    public void setIdentityDocumentNumber(String identityDocumentNumber) { this.identityDocumentNumber = identityDocumentNumber; }

    public java.time.LocalDate getIdentityDocumentExpiry() { return identityDocumentExpiry; }
    public void setIdentityDocumentExpiry(java.time.LocalDate identityDocumentExpiry) { this.identityDocumentExpiry = identityDocumentExpiry; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCsrContent() { return csrContent; }
    public void setCsrContent(String csrContent) { this.csrContent = csrContent; }

    public String getServerPrivateKeyPem() { return serverPrivateKeyPem; }
    public void setServerPrivateKeyPem(String serverPrivateKeyPem) { this.serverPrivateKeyPem = serverPrivateKeyPem; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getValidationToken() { return validationToken; }
    public void setValidationToken(String validationToken) { this.validationToken = validationToken; }

    public LocalDateTime getTokenExpiresAt() { return tokenExpiresAt; }
    public void setTokenExpiresAt(LocalDateTime tokenExpiresAt) { this.tokenExpiresAt = tokenExpiresAt; }

    public LocalDateTime getTokenUsedAt() { return tokenUsedAt; }
    public void setTokenUsedAt(LocalDateTime tokenUsedAt) { this.tokenUsedAt = tokenUsedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getDocuments() { return documents; }
    public void setDocuments(String documents) { this.documents = documents; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // --- Builder manuel (optionnel) ---
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private User user;
        private String commonName;
        private String organization;
        private String organizationalUnit;
        private String locality;
        private String state;
        private String country;
        private String email;
        private String status = "PENDING";
        private String csrContent;
        private LocalDateTime submittedAt;
        private LocalDateTime reviewedAt;
        private User reviewedBy;
        private String validationToken;
        private LocalDateTime tokenExpiresAt;
        private LocalDateTime tokenUsedAt;
        private String rejectionReason;
        private String notes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder commonName(String commonName) { this.commonName = commonName; return this; }
        public Builder organization(String organization) { this.organization = organization; return this; }
        public Builder organizationalUnit(String organizationalUnit) { this.organizationalUnit = organizationalUnit; return this; }
        public Builder locality(String locality) { this.locality = locality; return this; }
        public Builder state(String state) { this.state = state; return this; }
        public Builder country(String country) { this.country = country; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder csrContent(String csrContent) { this.csrContent = csrContent; return this; }
        public Builder submittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; return this; }
        public Builder reviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; return this; }
        public Builder reviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; return this; }
        public Builder validationToken(String validationToken) { this.validationToken = validationToken; return this; }
        public Builder tokenExpiresAt(LocalDateTime tokenExpiresAt) { this.tokenExpiresAt = tokenExpiresAt; return this; }
        public Builder tokenUsedAt(LocalDateTime tokenUsedAt) { this.tokenUsedAt = tokenUsedAt; return this; }
        public Builder rejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; return this; }
        public Builder notes(String notes) { this.notes = notes; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public CertificateRequest build() {
            return new CertificateRequest(id, user, commonName, organization, organizationalUnit, locality, state, country, email, status, csrContent, submittedAt, reviewedAt, reviewedBy, validationToken, tokenExpiresAt, tokenUsedAt, rejectionReason, notes, createdAt, updatedAt);
        }
    }
}
