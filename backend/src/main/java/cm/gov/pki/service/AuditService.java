package cm.gov.pki.service;

import cm.gov.pki.entity.AuditLog;
import cm.gov.pki.entity.User;
import cm.gov.pki.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * Service de journal d'audit
 * Traçabilité de toutes les actions sensibles
 */
@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    @Autowired
    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Enregistre une action dans le journal d'audit
     */
    @Transactional
    public void log(User user, String action, String entityType, UUID entityId, Map<String, Object> details) {
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build();

        auditLogRepository.save(auditLog);

        log.info("📋 AUDIT | User: {} | Action: {} | Entity: {} ({})", 
                user != null ? user.getEmail() : "SYSTEM",
                action,
                entityType,
                entityId);
    }

    /**
     * Enregistre une action système (sans utilisateur)
     */
    @Transactional
    public void logSystem(String action, String entityType, UUID entityId, Map<String, Object> details) {
        log(null, action, entityType, entityId, details);
    }
}