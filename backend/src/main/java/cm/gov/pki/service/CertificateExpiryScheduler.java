package cm.gov.pki.service;

import cm.gov.pki.entity.AuditLog;
import cm.gov.pki.entity.Certificate;
import cm.gov.pki.repository.AuditLogRepository;
import cm.gov.pki.repository.CertificateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Scheduler: envoie les alertes d'expiration 30 jours avant.
 */
@Service
public class CertificateExpiryScheduler {
    private static final Logger log = LoggerFactory.getLogger(CertificateExpiryScheduler.class);
    private static final int EXPIRY_DAYS = 30;

    private final CertificateRepository certificateRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailService emailService;
    private final AuditService auditService;

    public CertificateExpiryScheduler(
            CertificateRepository certificateRepository,
            AuditLogRepository auditLogRepository,
            EmailService emailService,
            AuditService auditService
    ) {
        this.certificateRepository = certificateRepository;
        this.auditLogRepository = auditLogRepository;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    /**
     * Tous les jours a 08h00.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void notifyExpiringCertificates() {
        try {
            LocalDateTime threshold = LocalDateTime.now().plusDays(EXPIRY_DAYS);
            List<Certificate> expiring = certificateRepository.findByStatusAndNotAfterBefore(
                    Certificate.CertificateStatus.ACTIVE,
                    threshold
            );

            if (expiring.isEmpty()) {
                return;
            }

            for (Certificate cert : expiring) {
                if (cert.getId() == null || cert.getUser() == null) continue;
                boolean alreadyNotified = auditLogRepository.existsByActionAndEntityId(
                        AuditLog.Actions.CERTIFICATE_EXPIRING_SOON,
                        cert.getId()
                );
                if (alreadyNotified) continue;

                String userName = (cert.getUser().getFirstName() + " " + cert.getUser().getLastName()).trim();
                String expiresAt = cert.getNotAfter() != null
                        ? cert.getNotAfter().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : "N/A";

                emailService.sendCertificateExpiryEmail(
                        cert.getUser().getEmail(),
                        userName,
                        cert.getId().toString(),
                        expiresAt
                );

                auditService.log(
                        cert.getUser(),
                        AuditLog.Actions.CERTIFICATE_EXPIRING_SOON,
                        "Certificate",
                        cert.getId(),
                        java.util.Map.of("expiresAt", expiresAt)
                );
            }
        } catch (Exception e) {
            log.error("Erreur scheduler expiration certificats", e);
        }
    }
}
