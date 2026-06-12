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
            Path crlPath = caService.writeAndPersistCRL(ca);
            log.info("Rotated CRL for CA {} -> {}", ca.caName, crlPath);
        } catch (Exception e) {
            log.error("Failed to rotate CRL", e);
        }
    }
}
