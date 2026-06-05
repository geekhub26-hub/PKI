package cm.gov.pki.service;

import cm.gov.pki.entity.CAConfiguration;
import cm.gov.pki.repository.CAConfigurationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class CRLRotationScheduler {
    private static final Logger log = LoggerFactory.getLogger(CRLRotationScheduler.class);

    private final CAService caService;
    private final CAConfigurationRepository caConfigurationRepository;

    public CRLRotationScheduler(CAService caService, CAConfigurationRepository caConfigurationRepository) {
        this.caService = caService;
        this.caConfigurationRepository = caConfigurationRepository;
    }

    // Run daily at 02:00
    @Scheduled(cron = "0 0 2 * * *")
    public void rotateCrl() {
        try {
            CAConfiguration ca = caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
                    .orElse(null);
            if (ca == null) return;
            String crlPem = caService.generateCRL(ca);
            Path crlPath = Path.of(caService.caStore, ca.caName.replaceAll("\\s+","_").toLowerCase() + ".crl.pem");
            Files.writeString(crlPath, crlPem);

            CAConfiguration updated = new CAConfiguration();
            updated.caName = ca.caName;
            updated.caCertPath = ca.caCertPath;
            updated.caKeyPath = ca.caKeyPath;
            updated.caCrlPath = crlPath.toAbsolutePath().toString();
            updated.validFrom = ca.validFrom;
            updated.validUntil = ca.validUntil;
            updated.keyAlgorithm = ca.keyAlgorithm;
            updated.keySize = ca.keySize;
            updated.signatureAlgorithm = ca.signatureAlgorithm;
            updated.isActive = ca.isActive;
            // autres champs si besoin
            caConfigurationRepository.save(updated);
            log.info("Rotated CRL for CA {} -> {}", ca.caName, crlPath);
        } catch (Exception e) {
            log.error("Failed to rotate CRL", e);
        }
    }
}
