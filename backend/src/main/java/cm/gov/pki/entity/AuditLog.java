package cm.gov.pki.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Journal d'audit - Traçabilité de toutes les actions sensibles
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_logs_user_id", columnList = "user_id"),
    @Index(name = "idx_audit_logs_action", columnList = "action"),
    @Index(name = "idx_audit_logs_created_at", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
// Suppression Lombok : constructeurs, getters, setters manuels
public class AuditLog {

    public AuditLog() {}
    public AuditLog(UUID id, User user, String action, String entityType, UUID entityId, String ipAddress, String userAgent, Map<String, Object> details, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.details = details;
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private User user;
        private String action;
        private String entityType;
        private UUID entityId;
        private String ipAddress;
        private String userAgent;
        private Map<String, Object> details;
        private LocalDateTime createdAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder action(String action) { this.action = action; return this; }
        public Builder entityType(String entityType) { this.entityType = entityType; return this; }
        public Builder entityId(UUID entityId) { this.entityId = entityId; return this; }
        public Builder ipAddress(String ipAddress) { this.ipAddress = ipAddress; return this; }
        public Builder userAgent(String userAgent) { this.userAgent = userAgent; return this; }
        public Builder details(Map<String, Object> details) { this.details = details; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public AuditLog build() {
            AuditLog a = new AuditLog();
            a.id = this.id;
            a.user = this.user;
            a.action = this.action;
            a.entityType = this.entityType;
            a.entityId = this.entityId;
            a.ipAddress = this.ipAddress;
            a.userAgent = this.userAgent;
            a.details = this.details;
            a.createdAt = this.createdAt == null ? LocalDateTime.now() : this.createdAt;
            return a;
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "entity_type", length = 50)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "ip_address", columnDefinition = "VARCHAR(45)")
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> details;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    /**
     * Actions auditées standard
     */
    public static final class Actions {
        public static final String USER_LOGIN = "USER_LOGIN";
        public static final String USER_LOGOUT = "USER_LOGOUT";
        public static final String USER_REGISTER = "USER_REGISTER";
        public static final String CA_INITIALIZED = "CA_INITIALIZED";
        public static final String REQUEST_SUBMITTED = "REQUEST_SUBMITTED";
        public static final String REQUEST_UPDATED = "REQUEST_UPDATED";
        public static final String CSR_SUBMITTED = "CSR_SUBMITTED";
        public static final String CSR_APPROVED = "CSR_APPROVED";
        public static final String CSR_REJECTED = "CSR_REJECTED";
        public static final String TOKEN_VALIDATED = "TOKEN_VALIDATED";
        public static final String CERTIFICATE_ISSUED = "CERTIFICATE_ISSUED";
        public static final String CERTIFICATE_REVOKED = "CERTIFICATE_REVOKED";
        public static final String CRL_PUBLISHED = "CRL_PUBLISHED";
        public static final String CERTIFICATE_EXPIRING_SOON = "CERTIFICATE_EXPIRING_SOON";
        public static final String CERTIFICATE_RENEWED = "CERTIFICATE_RENEWED";
    }
}
