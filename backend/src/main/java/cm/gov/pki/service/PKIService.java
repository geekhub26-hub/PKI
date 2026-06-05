package cm.gov.pki.service;

import cm.gov.pki.dto.DashboardDTO;
import cm.gov.pki.entity.CAConfiguration;
import cm.gov.pki.entity.Certificate;
import cm.gov.pki.entity.User;
import cm.gov.pki.repository.CAConfigurationRepository;
import cm.gov.pki.repository.CertificateRepository;
import cm.gov.pki.repository.CertificateRequestRepository;
import cm.gov.pki.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Service principal de gestion PKI
 * Orchestration AC + Certificats
 */
@Service
public class PKIService {
    private final CAConfigurationRepository caConfigRepository;
    private final CertificateRequestRepository requestRepository;
    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final OpenSSLService opensslService;
    private final AuditService auditService;

    private static final Logger log = LoggerFactory.getLogger(PKIService.class);

    @Autowired
    public PKIService(CAConfigurationRepository caConfigRepository,
                      CertificateRequestRepository requestRepository,
                      CertificateRepository certificateRepository,
                      UserRepository userRepository,
                      OpenSSLService opensslService,
                      AuditService auditService) {
        this.caConfigRepository = caConfigRepository;
        this.requestRepository = requestRepository;
        this.certificateRepository = certificateRepository;
        this.userRepository = userRepository;
        this.opensslService = opensslService;
        this.auditService = auditService;
    }

    @Value("${pki.ca-defaults.name:Autorité de Certification Souveraine}")
    private String defaultCAName;

    @Value("${pki.ca-defaults.validity-years:10}")
    private int defaultValidityYears;

    /**
     * Initialise l'Autorité de Certification Racine
     * À exécuter UNE SEULE FOIS par Admin
     */
    @Transactional
    public DashboardDTO.CAStatus initializeRootCA(User admin) throws Exception {
        log.info("🚀 Initialisation de l'AC Racine par {}");

        if (!admin.isAdmin()) {
            throw new SecurityException("Seuls les administrateurs peuvent initialiser l'AC");
        }

        if (caConfigRepository.existsByIsActiveTrue()) {
            throw new IllegalStateException("Une AC Racine est déjà active");
        }

        // Vérifier OpenSSL
        if (!opensslService.isOpenSSLAvailable()) {
            throw new RuntimeException("OpenSSL n'est pas disponible sur ce système");
        }

        // Générer l'AC via OpenSSL
        int validityDays = defaultValidityYears * 365;
        Map<String, String> caInfo = opensslService.generateRootCA(defaultCAName, validityDays);

        // Sauvegarder en base de données
        CAConfiguration caConfig = new CAConfiguration();
        caConfig.caName = defaultCAName;
        caConfig.caCertPath = caInfo.get("certPath");
        caConfig.caKeyPath = caInfo.get("keyPath");
        caConfig.validFrom = LocalDateTime.now();
        caConfig.validUntil = LocalDateTime.now().plusDays(validityDays);
        caConfig.keyAlgorithm = "RSA";
        caConfig.keySize = 4096;
        caConfig.signatureAlgorithm = "SHA256withRSA";
        caConfig.isActive = true;
        caConfig.createdBy = admin;

        caConfig = caConfigRepository.save(caConfig);

        auditService.log(admin, "CA_INITIALIZED", "CAConfiguration", caConfig.id,
            Map.of("caName", defaultCAName, "validityYears", defaultValidityYears));

        log.info("✅ AC Racine initialisée avec succès. Clé: {}");

        return buildCAStatus(caConfig);
    }

    /**
     * Récupère le statut de l'AC Racine
     */
    public DashboardDTO.CAStatus getCAStatus() {
        return caConfigRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
                .map(this::buildCAStatus)
                .orElse(DashboardDTO.CAStatus.builder()
                        .isInitialized(false)
                        .isActive(false)
                        .build());
    }

    /**
     * Récupère les statistiques pour le Dashboard Admin
     */
    public DashboardDTO getAdminDashboard() {
        long totalUsers = userRepository.count() - 1; // -1 pour exclure l'admin système
        long pendingRequests = requestRepository.countByStatus("PENDING");
        long activeCertificates = certificateRepository.countByStatus(Certificate.CertificateStatus.ACTIVE);
        long revokedCertificates = certificateRepository.countByStatus(Certificate.CertificateStatus.REVOKED);

        return DashboardDTO.builder()
                .totalUsers(totalUsers)
                .pendingRequests(pendingRequests)
                .activeCertificates(activeCertificates)
                .revokedCertificates(revokedCertificates)
                .caStatus(getCAStatus())
                .build();
    }

    /**
     * Construit le DTO de statut CA
     */
    private DashboardDTO.CAStatus buildCAStatus(CAConfiguration ca) {
        long daysUntilExpiration = ChronoUnit.DAYS.between(LocalDateTime.now(), ca.validUntil);

        return DashboardDTO.CAStatus.builder()
            .isInitialized(true)
            .isActive(ca.isActive)
            .caName(ca.caName)
            .validFrom(ca.validFrom)
            .validUntil(ca.validUntil)
            .daysUntilExpiration(daysUntilExpiration)
            .subjectDN(ca.getSubjectDN())
            .build();
    }

    /**
     * Vérifie si l'AC est initialisée et valide
     */
    public boolean isCAReady() {
        return caConfigRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
                .map(CAConfiguration::isValid)
                .orElse(false);
    }
}