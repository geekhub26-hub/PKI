package cm.gov.pki.entity;

import jakarta.persistence.*;
// Lombok supprimé : constructeurs, getters, setters générés manuellement
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Certificat X.509 émis par l'AC
 */
@Entity
@Table(name = "certificates", indexes = {
    @Index(name = "idx_certificates_user_id", columnList = "user_id"),
    @Index(name = "idx_certificates_serial_number", columnList = "serial_number", unique = true),
    @Index(name = "idx_certificates_status", columnList = "status"),
    @Index(name = "idx_certificates_not_after", columnList = "not_after")
})
@EntityListeners(AuditingEntityListener.class)
// Lombok annotations supprimées
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private CertificateRequest request;

    // Identifiants du certificat
    @Column(name = "serial_number", nullable = false, unique = true, length = 255)
    private String serialNumber;

    @Column(name = "fingerprint_sha256", nullable = false, unique = true, length = 64)
    private String fingerprintSha256;

    // Contenu du certificat
    @Column(name = "certificate_pem", nullable = false, columnDefinition = "TEXT")
    private String certificatePem;

    @Column(name = "public_key_pem", columnDefinition = "TEXT")
    private String publicKeyPem;

    @Column(name = "private_key_pem", columnDefinition = "TEXT")
    private String privateKeyPem;

    // Métadonnées X.509
    @Column(name = "subject_dn", nullable = false, length = 500)
    private String subjectDN;

    @Column(name = "issuer_dn", nullable = false, length = 500)
    private String issuerDN;

    // Validité
    @Column(name = "not_before", nullable = false)
    private LocalDateTime notBefore;

    @Column(name = "not_after", nullable = false)
    private LocalDateTime notAfter;

    // État du certificat
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CertificateStatus status = CertificateStatus.ACTIVE;

    // Révocation
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revoked_by")
    private User revokedBy;

    @Column(name = "revocation_reason", length = 255)
    private String revocationReason;

    // Traçabilité
    @Column(name = "issued_at")
    @CreatedDate
    private LocalDateTime issuedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by")
    private User issuedBy;

    @Column(name = "created_at", updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * Statuts possibles d'un certificat
     */
    public enum CertificateStatus {
        ACTIVE,     // Actif et utilisable
        EXPIRED,    // Expiré
        REVOKED,    // Révoqué
        SUSPENDED   // Suspendu temporairement
    }

    /**
     * Vérifie si le certificat est actuellement valide
     */
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return status == CertificateStatus.ACTIVE &&
               now.isAfter(notBefore) &&
               now.isBefore(notAfter);
    }

    /**
     * Vérifie si le certificat expire bientôt (moins de 30 jours)
     */
    public boolean isExpiringSoon() {
        if (status != CertificateStatus.ACTIVE) {
            return false;
        }
        LocalDateTime threshold = LocalDateTime.now().plusDays(30);
        return notAfter.isBefore(threshold);
    }

    /**
     * Vérifie si le certificat est expiré
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(notAfter);
    }

    /**
     * Calcule la durée de validité restante en jours
     */
    public long getDaysUntilExpiration() {
        return java.time.temporal.ChronoUnit.DAYS.between(
            LocalDateTime.now(), 
            notAfter
        );
    }
    // --- Constructeurs ---
    public Certificate() {
        // Constructeur sans argument
    }

    public Certificate(UUID id, User user, CertificateRequest request, String serialNumber, String fingerprintSha256,
                       String certificatePem, String publicKeyPem, String subjectDN, String issuerDN,
                       LocalDateTime notBefore, LocalDateTime notAfter, CertificateStatus status,
                       LocalDateTime revokedAt, User revokedBy, String revocationReason,
                       LocalDateTime issuedAt, User issuedBy, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.user = user;
        this.request = request;
        this.serialNumber = serialNumber;
        this.fingerprintSha256 = fingerprintSha256;
        this.certificatePem = certificatePem;
        this.publicKeyPem = publicKeyPem;
        this.subjectDN = subjectDN;
        this.issuerDN = issuerDN;
        this.notBefore = notBefore;
        this.notAfter = notAfter;
        this.status = status;
        this.revokedAt = revokedAt;
        this.revokedBy = revokedBy;
        this.revocationReason = revocationReason;
        this.issuedAt = issuedAt;
        this.issuedBy = issuedBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // --- Getters et Setters ---
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public CertificateRequest getRequest() { return request; }
    public void setRequest(CertificateRequest request) { this.request = request; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getFingerprintSha256() { return fingerprintSha256; }
    public void setFingerprintSha256(String fingerprintSha256) { this.fingerprintSha256 = fingerprintSha256; }

    public String getCertificatePem() { return certificatePem; }
    public void setCertificatePem(String certificatePem) { this.certificatePem = certificatePem; }

    public String getPublicKeyPem() { return publicKeyPem; }
    public void setPublicKeyPem(String publicKeyPem) { this.publicKeyPem = publicKeyPem; }

    public String getPrivateKeyPem() { return privateKeyPem; }
    public void setPrivateKeyPem(String privateKeyPem) { this.privateKeyPem = privateKeyPem; }

    public String getSubjectDN() { return subjectDN; }
    public void setSubjectDN(String subjectDN) { this.subjectDN = subjectDN; }

    public String getIssuerDN() { return issuerDN; }
    public void setIssuerDN(String issuerDN) { this.issuerDN = issuerDN; }

    public LocalDateTime getNotBefore() { return notBefore; }
    public void setNotBefore(LocalDateTime notBefore) { this.notBefore = notBefore; }

    public LocalDateTime getNotAfter() { return notAfter; }
    public void setNotAfter(LocalDateTime notAfter) { this.notAfter = notAfter; }

    public CertificateStatus getStatus() { return status; }
    public void setStatus(CertificateStatus status) { this.status = status; }

    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }

    public User getRevokedBy() { return revokedBy; }
    public void setRevokedBy(User revokedBy) { this.revokedBy = revokedBy; }

    public String getRevocationReason() { return revocationReason; }
    public void setRevocationReason(String revocationReason) { this.revocationReason = revocationReason; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }

    public User getIssuedBy() { return issuedBy; }
    public void setIssuedBy(User issuedBy) { this.issuedBy = issuedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // --- Builder manuel (optionnel) ---
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private User user;
        private CertificateRequest request;
        private String serialNumber;
        private String fingerprintSha256;
        private String certificatePem;
        private String publicKeyPem;
        private String subjectDN;
        private String issuerDN;
        private LocalDateTime notBefore;
        private LocalDateTime notAfter;
        private CertificateStatus status = CertificateStatus.ACTIVE;
        private LocalDateTime revokedAt;
        private User revokedBy;
        private String revocationReason;
        private LocalDateTime issuedAt;
        private User issuedBy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder request(CertificateRequest request) { this.request = request; return this; }
        public Builder serialNumber(String serialNumber) { this.serialNumber = serialNumber; return this; }
        public Builder fingerprintSha256(String fingerprintSha256) { this.fingerprintSha256 = fingerprintSha256; return this; }
        public Builder certificatePem(String certificatePem) { this.certificatePem = certificatePem; return this; }
        public Builder publicKeyPem(String publicKeyPem) { this.publicKeyPem = publicKeyPem; return this; }
        public Builder subjectDN(String subjectDN) { this.subjectDN = subjectDN; return this; }
        public Builder issuerDN(String issuerDN) { this.issuerDN = issuerDN; return this; }
        public Builder notBefore(LocalDateTime notBefore) { this.notBefore = notBefore; return this; }
        public Builder notAfter(LocalDateTime notAfter) { this.notAfter = notAfter; return this; }
        public Builder status(CertificateStatus status) { this.status = status; return this; }
        public Builder revokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; return this; }
        public Builder revokedBy(User revokedBy) { this.revokedBy = revokedBy; return this; }
        public Builder revocationReason(String revocationReason) { this.revocationReason = revocationReason; return this; }
        public Builder issuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; return this; }
        public Builder issuedBy(User issuedBy) { this.issuedBy = issuedBy; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Certificate build() {
            return new Certificate(id, user, request, serialNumber, fingerprintSha256, certificatePem, publicKeyPem,
                    subjectDN, issuerDN, notBefore, notAfter, status, revokedAt, revokedBy, revocationReason,
                    issuedAt, issuedBy, createdAt, updatedAt);
        }
    }
}
