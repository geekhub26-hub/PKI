package cm.gov.pki.controller;

import cm.gov.pki.dto.AuthDTO;
import cm.gov.pki.entity.Certificate;
import cm.gov.pki.entity.CertificateRequest;
import cm.gov.pki.entity.User;
import cm.gov.pki.repository.CAConfigurationRepository;
import cm.gov.pki.repository.CertificateRepository;
import cm.gov.pki.repository.CertificateRequestRepository;
import cm.gov.pki.repository.UserRepository;
import cm.gov.pki.service.AuditService;
import cm.gov.pki.service.CAService;
import cm.gov.pki.service.EmailService;
import cm.gov.pki.service.IdentityDocumentAiService;
import cm.gov.pki.service.SharePayService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/user")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private static final long MAX_FILE_SIZE = 100L * 1024L * 1024L; // 100MB
    private static final long MAX_SELFIE_SIZE = 10L * 1024L * 1024L; // 10MB
    private static final long MAX_CSR_SIZE = 200L * 1024L; // 200KB
    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp"
    );
    private static final Map<String, String> ALLOWED_EXTENSIONS = Map.of(
            "pdf", "application/pdf",
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "webp", "image/webp"
    );

    private Path uploadRoot() {
        String configured = System.getenv("PKI_UPLOAD_DIR");
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured);
        }
        return Paths.get(System.getProperty("user.dir"), "uploads");
    }

    private final CertificateRepository certificateRepository;
    private final CertificateRequestRepository certificateRequestRepository;
    private final CAService caService;
    private final IdentityDocumentAiService identityDocumentAiService;
    private final CAConfigurationRepository caConfigurationRepository;
    private final AuditService auditService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SharePayService sharePayService;

    @Autowired
    public UserController(
            CertificateRepository certificateRepository,
            CertificateRequestRepository certificateRequestRepository,
            CAService caService,
            IdentityDocumentAiService identityDocumentAiService,
            CAConfigurationRepository caConfigurationRepository,
            AuditService auditService,
            EmailService emailService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            SharePayService sharePayService
    ) {
        this.certificateRepository = certificateRepository;
        this.certificateRequestRepository = certificateRequestRepository;
        this.caService = caService;
        this.identityDocumentAiService = identityDocumentAiService;
        this.caConfigurationRepository = caConfigurationRepository;
        this.emailService = emailService;
        this.auditService = auditService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.sharePayService = sharePayService;
    }

    private AuthDTO.UserDTO toUserDTO(User user) {
        AuthDTO.UserDTO dto = new AuthDTO.UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(user.getRole().name());
        dto.setIsActive(user.getIsActive());
        dto.setEmailVerified(user.getEmailVerified());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastLogin(user.getLastLogin());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDTO.UserDTO> me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(toUserDTO(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(401).build();
        }
        String firstName = body.getOrDefault("firstName", "").trim();
        String lastName  = body.getOrDefault("lastName",  "").trim();
        if (firstName.isEmpty() || lastName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Prénom et nom sont requis."));
        }
        user.setFirstName(firstName);
        user.setLastName(lastName);
        return ResponseEntity.ok(toUserDTO(userRepository.save(user)));
    }

    @PutMapping("/avatar")
    public ResponseEntity<?> updateAvatar(@RequestBody Map<String, String> body, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(401).build();
        }
        String avatarUrl = body.get("avatarUrl");
        if (avatarUrl != null && avatarUrl.length() > 500_000) {
            return ResponseEntity.badRequest().body(Map.of("error", "Image trop volumineuse (max 500 Ko en base64)."));
        }
        user.setAvatarUrl(avatarUrl);
        return ResponseEntity.ok(toUserDTO(userRepository.save(user)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(401).build();
        }
        String current    = body.getOrDefault("currentPassword", "");
        String newPwd     = body.getOrDefault("newPassword",     "");
        String confirmPwd = body.getOrDefault("confirmPassword", "");
        if (current.isEmpty() || newPwd.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tous les champs sont requis."));
        }
        if (!passwordEncoder.matches(current, user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mot de passe actuel incorrect."));
        }
        if (newPwd.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le nouveau mot de passe doit comporter au moins 8 caractères."));
        }
        if (!confirmPwd.isEmpty() && !newPwd.equals(confirmPwd)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Les nouveaux mots de passe ne correspondent pas."));
        }
        user.setPasswordHash(passwordEncoder.encode(newPwd));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès."));
    }

    @GetMapping("/certificates")
    public ResponseEntity<?> getMyCertificates(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        var certs = certificateRepository.findByUserOrderByIssuedAtDesc(user);
        var result = certs.stream().map(CertificateDTO::new).toList();
        return ResponseEntity.ok(result);
    }

    /**
     * Etapes 1-2: soumission pour verification admin.
     */
    @PostMapping(value = "/certificate-requests", consumes = {"multipart/form-data"})
    public ResponseEntity<?> submitCertificateRequest(
            Authentication authentication,
            @RequestParam(name = "commonName", required = false) String commonName,
            @RequestParam(name = "organization", required = false) String organization,
            @RequestParam(name = "organizationalUnit", required = false) String organizationalUnit,
            @RequestParam(name = "locality", required = false) String locality,
            @RequestParam(name = "state", required = false) String state,
            @RequestParam(name = "country", required = false) String country,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "firstName", required = false) String firstName,
            @RequestParam(name = "lastName", required = false) String lastName,
            @RequestParam(name = "birthDate", required = false) String birthDate,
            @RequestParam(name = "birthPlace", required = false) String birthPlace,
            @RequestParam(name = "nationality", required = false) String nationality,
            @RequestParam(name = "identityDocumentType", required = false) String identityDocumentType,
            @RequestParam(name = "identityDocumentNumber", required = false) String identityDocumentNumber,
            @RequestParam(name = "identityDocumentExpiry", required = false) String identityDocumentExpiry,
            @RequestParam(name = "csr", required = false) String csr,
            @RequestPart(name = "documents", required = false) MultipartFile[] documents,
            @RequestPart(name = "selfie", required = false) MultipartFile selfie,
            @RequestPart(name = "csrFile", required = false) MultipartFile csrFile
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();

        CertificateRequest req = new CertificateRequest();
        req.setUser(user);
        req.setCommonName((commonName == null || commonName.isBlank()) ? (user.getFirstName() + " " + user.getLastName()) : commonName.trim());
        req.setOrganization(organization);
        req.setOrganizationalUnit(organizationalUnit);
        req.setLocality(locality);
        req.setState(state);
        req.setCountry(country);
        req.setEmail((email == null || email.isBlank()) ? user.getEmail() : email.trim());
        req.setFirstName((firstName == null || firstName.isBlank()) ? user.getFirstName() : firstName.trim());
        req.setLastName((lastName == null || lastName.isBlank()) ? user.getLastName() : lastName.trim());
        req.setBirthPlace((birthPlace == null || birthPlace.isBlank()) ? null : birthPlace.trim());
        req.setNationality((nationality == null || nationality.isBlank()) ? null : nationality.trim().toUpperCase());
        req.setIdentityDocumentType((identityDocumentType == null || identityDocumentType.isBlank()) ? null : identityDocumentType.trim().toUpperCase());
        req.setIdentityDocumentNumber((identityDocumentNumber == null || identityDocumentNumber.isBlank()) ? null : identityDocumentNumber.trim());
        req.setBirthDate(parseOptionalDate(birthDate));
        req.setIdentityDocumentExpiry(parseOptionalDate(identityDocumentExpiry));
        try {
            req.setCsrContent(readCsrInput(csr, csrFile));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(400).body(Map.of("error", ex.getMessage()));
        }

        String validationError = validateBaseRequest(req);
        if (validationError != null) {
            return ResponseEntity.status(400).body(Map.of("error", validationError));
        }

        req.setStatus("PENDING_REVIEW");
        req.setSubmittedAt(LocalDateTime.now());
        req = certificateRequestRepository.save(req);

        // statut_kyc : EN_COURS dès la soumission
        user.setStatutKyc("EN_COURS");
        userRepository.save(user);

        String savedDocs;
        try {
            savedDocs = joinNonBlank(
                    saveDocuments(req.getId(), documents, req.getIdentityDocumentType()),
                    saveSelfie(req.getId(), selfie)
            );
        } catch (IllegalArgumentException iae) {
            try {
                certificateRequestRepository.delete(req);
            } catch (Exception ex) {
                log.warn("Failed to rollback request {}", req.getId(), ex);
            }
            return ResponseEntity.status(400).body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            try {
                certificateRequestRepository.delete(req);
            } catch (Exception rollbackEx) {
                log.warn("Failed to rollback request {}", req.getId(), rollbackEx);
            }
            return ResponseEntity.status(500).body(Map.of("error", "Erreur lors de l'enregistrement des fichiers"));
        }
        req.setDocuments(savedDocs);
        req.setNotes(savedDocs);
        req = certificateRequestRepository.save(req);

        // Comparaison faciale selfie ↔ pièce d'identité
        if (selfie != null && !selfie.isEmpty() && documents != null && documents.length > 0) {
            try {
                var faceResult = identityDocumentAiService.compareFaces(documents[0], selfie);
                if (!faceResult.match()) {
                    try { certificateRequestRepository.delete(req); } catch (Exception ignore) {}
                    return ResponseEntity.status(400).body(Map.of(
                        "error", "Le selfie ne correspond pas au visage sur la pièce d'identité. Veuillez reprendre votre selfie face à la caméra. (" + faceResult.message() + ")"
                    ));
                }
                log.info("Face comparison passed for request {} (similarity={})", req.getId(), faceResult.similarity());
            } catch (Exception e) {
                log.warn("Face comparison error for request {}: {}", req.getId(), e.getMessage());
            }
        }

        auditService.log(user, cm.gov.pki.entity.AuditLog.Actions.REQUEST_SUBMITTED, "CertificateRequest", req.getId(), null);

        return ResponseEntity.ok(Map.of(
                "requestId", req.getId().toString(),
                "status", req.getStatus(),
                "message", "Demande soumise pour verification admin"
        ));
    }

    /**
     * Correction apres rejet de verification admin.
     */
    @PutMapping(value = "/certificate-requests/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateCertificateRequest(
            Authentication authentication,
            @PathVariable("id") UUID id,
            @RequestParam(name = "commonName", required = false) String commonName,
            @RequestParam(name = "organization", required = false) String organization,
            @RequestParam(name = "organizationalUnit", required = false) String organizationalUnit,
            @RequestParam(name = "locality", required = false) String locality,
            @RequestParam(name = "state", required = false) String state,
            @RequestParam(name = "country", required = false) String country,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "firstName", required = false) String firstName,
            @RequestParam(name = "lastName", required = false) String lastName,
            @RequestParam(name = "birthDate", required = false) String birthDate,
            @RequestParam(name = "birthPlace", required = false) String birthPlace,
            @RequestParam(name = "nationality", required = false) String nationality,
            @RequestParam(name = "identityDocumentType", required = false) String identityDocumentType,
            @RequestParam(name = "identityDocumentNumber", required = false) String identityDocumentNumber,
            @RequestParam(name = "identityDocumentExpiry", required = false) String identityDocumentExpiry,
            @RequestPart(name = "documents", required = false) MultipartFile[] documents
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        var opt = certificateRequestRepository.findByIdAndUser(id, user);
        if (opt.isEmpty()) return ResponseEntity.status(404).build();
        CertificateRequest req = opt.get();

        if (!"NEEDS_CORRECTION".equalsIgnoreCase(req.getStatus()) && !"REJECTED".equalsIgnoreCase(req.getStatus())) {
            return ResponseEntity.status(400).body(Map.of("error", "Request is not editable"));
        }

        req.setCommonName((commonName == null || commonName.isBlank()) ? req.getCommonName() : commonName.trim());
        req.setOrganization((organization == null || organization.isBlank()) ? req.getOrganization() : organization.trim());
        req.setOrganizationalUnit(organizationalUnit);
        req.setLocality((locality == null || locality.isBlank()) ? req.getLocality() : locality.trim());
        req.setState(state);
        req.setCountry((country == null || country.isBlank()) ? req.getCountry() : country.trim());
        if (email != null && !email.isBlank()) req.setEmail(email.trim());
        if (firstName != null && !firstName.isBlank()) req.setFirstName(firstName.trim());
        if (lastName != null && !lastName.isBlank()) req.setLastName(lastName.trim());
        if (birthPlace != null && !birthPlace.isBlank()) req.setBirthPlace(birthPlace.trim());
        if (nationality != null && !nationality.isBlank()) req.setNationality(nationality.trim().toUpperCase());
        if (identityDocumentType != null && !identityDocumentType.isBlank()) req.setIdentityDocumentType(identityDocumentType.trim().toUpperCase());
        if (identityDocumentNumber != null && !identityDocumentNumber.isBlank()) req.setIdentityDocumentNumber(identityDocumentNumber.trim());
        if (birthDate != null) req.setBirthDate(parseOptionalDate(birthDate));
        if (identityDocumentExpiry != null) req.setIdentityDocumentExpiry(parseOptionalDate(identityDocumentExpiry));

        String validationError = validateBaseRequest(req);
        if (validationError != null) {
            return ResponseEntity.status(400).body(Map.of("error", validationError));
        }

        if (documents != null && documents.length > 0) {
            String savedDocs;
            try {
                savedDocs = saveDocuments(req.getId(), documents, req.getIdentityDocumentType());
            } catch (IllegalArgumentException iae) {
                return ResponseEntity.status(400).body(Map.of("error", iae.getMessage()));
            } catch (Exception ex) {
                return ResponseEntity.status(500).body(Map.of("error", "Erreur lors de l'enregistrement des fichiers"));
            }
            req.setDocuments(savedDocs);
            req.setNotes(savedDocs);
        }

        req.setStatus("PENDING_REVIEW");
        req.setRejectionReason(null);
        req.setReviewedAt(null);
        req.setReviewedBy(null);
        req.setSubmittedAt(LocalDateTime.now());
        req = certificateRequestRepository.save(req);

        // statut_kyc repassé EN_COURS après re-soumission suite à correction
        final cm.gov.pki.entity.User reqUser = req.getUser();
        reqUser.setStatutKyc("EN_COURS");
        userRepository.save(reqUser);

        auditService.log(user, cm.gov.pki.entity.AuditLog.Actions.REQUEST_UPDATED, "CertificateRequest", req.getId(), null);

        return ResponseEntity.ok(Map.of("requestId", req.getId().toString(), "status", req.getStatus()));
    }

    /**
     * Etape 3: soumission CSR apres validation admin.
     */
    @PostMapping(value = "/certificate-requests/{id}/submit-csr", consumes = {"multipart/form-data"})
    public ResponseEntity<?> submitCsrAfterReview(
            Authentication authentication,
            @PathVariable("id") UUID id,
            @RequestParam(name = "csr", required = false) String csr,
            @RequestPart(name = "csrFile", required = false) MultipartFile csrFile
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        var opt = certificateRequestRepository.findByIdAndUser(id, user);
        if (opt.isEmpty()) return ResponseEntity.status(404).build();
        CertificateRequest req = opt.get();

        String reqStatus = req.getStatus() == null ? "" : req.getStatus().toUpperCase();
        if ("AWAITING_PAYMENT".equals(reqStatus)) {
            reqStatus = autoConfirmIfPaid(req);
        }
        if (!"PAYMENT_CONFIRMED".equals(reqStatus)) {
            return ResponseEntity.status(400).body(Map.of("error",
                    "AWAITING_PAYMENT".equals(reqStatus)
                    ? "Paiement non encore confirmé par SharePay. Utilisez le bouton 'Vérifier' sur la page de suivi."
                    : "Confirmation de paiement requise avant la soumission du CSR."));
        }

        String csrContent;
        try {
            csrContent = readCsrInput(csr, csrFile);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(400).body(Map.of("error", ex.getMessage()));
        }
        if (csrContent == null || csrContent.isBlank()) {
            return ResponseEntity.status(400).body(Map.of("error", "Un CSR est requis (texte ou fichier)"));
        }
        req.setServerPrivateKeyPem(null);

        return finalizeCsrSubmission(req, csrContent);
    }

    /**
     * Etape 3 (alternative): generation serveur d'une CSR puis soumission directe.
     */
    @PostMapping("/certificate-requests/{id}/generate-csr")
    public ResponseEntity<?> generateAndSubmitCsr(
            Authentication authentication,
            @PathVariable("id") UUID id,
            @RequestParam(name = "cn", required = false) String cn,
            @RequestParam(name = "o", required = false) String organization,
            @RequestParam(name = "ou", required = false) String organizationalUnit,
            @RequestParam(name = "l", required = false) String locality,
            @RequestParam(name = "st", required = false) String state,
            @RequestParam(name = "c", required = false) String country,
            @RequestParam(name = "email", required = false) String email
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        var opt = certificateRequestRepository.findByIdAndUser(id, user);
        if (opt.isEmpty()) return ResponseEntity.status(404).build();
        CertificateRequest req = opt.get();

        String reqStatus2 = req.getStatus() == null ? "" : req.getStatus().toUpperCase();
        if ("AWAITING_PAYMENT".equals(reqStatus2)) {
            reqStatus2 = autoConfirmIfPaid(req);
        }
        if (!"PAYMENT_CONFIRMED".equals(reqStatus2)) {
            return ResponseEntity.status(400).body(Map.of("error",
                    "AWAITING_PAYMENT".equals(reqStatus2)
                    ? "Paiement non encore confirmé par SharePay. Utilisez le bouton 'Vérifier' sur la page de suivi."
                    : "Confirmation de paiement requise avant la soumission du CSR."));
        }

        String resolvedCn = (cn == null || cn.isBlank()) ? req.getCommonName() : cn.trim();
        String resolvedOrg = (organization == null || organization.isBlank()) ? req.getOrganization() : organization.trim();
        String resolvedCountry = (country == null || country.isBlank()) ? req.getCountry() : country.trim().toUpperCase();
        if (resolvedCn == null || resolvedCn.isBlank()) {
            return ResponseEntity.status(400).body(Map.of("error", "Common Name requis"));
        }
        if (resolvedOrg == null || resolvedOrg.isBlank()) {
            return ResponseEntity.status(400).body(Map.of("error", "Organisation requise"));
        }
        if (resolvedCountry == null || !resolvedCountry.matches("^[A-Za-z]{2}$")) {
            return ResponseEntity.status(400).body(Map.of("error", "Pays invalide (ISO 2 lettres)"));
        }

        String resolvedOu = (organizationalUnit == null || organizationalUnit.isBlank()) ? req.getOrganizationalUnit() : organizationalUnit.trim();
        String resolvedLocality = (locality == null || locality.isBlank()) ? req.getLocality() : locality.trim();
        String resolvedState = (state == null || state.isBlank()) ? req.getState() : state.trim();
        String resolvedEmail = (email == null || email.isBlank()) ? req.getEmail() : email.trim();

        CAService.GeneratedCsr generated = caService.generateCSRWithKey(
                resolvedCn,
                resolvedOrg,
                resolvedOu,
                resolvedLocality,
                resolvedState,
                resolvedCountry,
                resolvedEmail
        );
        req.setServerPrivateKeyPem(generated.getPrivateKeyPem());
        return finalizeCsrSubmission(req, generated.getCsrPem());
    }

    /**
     * Si la demande est en AWAITING_PAYMENT et que SharePay confirme le paiement,
     * met à jour le statut en PAYMENT_CONFIRMED et retourne le nouveau statut.
     */
    private String autoConfirmIfPaid(CertificateRequest req) {
        String ref = req.getSharePayReference();
        if (ref == null || ref.isBlank()) return req.getStatus();
        try {
            String payStatus = sharePayService.getPayInStatus(ref);
            if ("SUCCESS".equalsIgnoreCase(payStatus)) {
                req.setStatus("PAYMENT_CONFIRMED");
                certificateRequestRepository.save(req);
                log.info("Paiement auto-confirmé lors de la soumission CSR pour demande {} (ref={})", req.getId(), ref);
                return "PAYMENT_CONFIRMED";
            }
        } catch (Exception e) {
            log.warn("Auto-vérification paiement impossible pour demande {}: {}", req.getId(), e.getMessage());
        }
        return req.getStatus();
    }

    private ResponseEntity<?> finalizeCsrSubmission(CertificateRequest req, String csrContent) {
        req.setCsrContent(csrContent);
        req.setStatus("CSR_SUBMITTED");
        req.setSubmittedAt(LocalDateTime.now());
        req = certificateRequestRepository.save(req);
        if (req.getUser() != null) {
            auditService.log(req.getUser(), cm.gov.pki.entity.AuditLog.Actions.CSR_SUBMITTED, "CertificateRequest", req.getId(), null);
        }
        return ResponseEntity.ok(Map.of("requestId", req.getId().toString(), "status", req.getStatus()));
    }

    @GetMapping("/certificate-requests")
    public ResponseEntity<?> getMyRequests(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        var reqs = certificateRequestRepository.findByUserOrderBySubmittedAtDesc(user);
        var dto = reqs.stream().map(CertificateRequestDTO::new).toList();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/certificate-requests/{id}/documents/{filename}")
    public ResponseEntity<?> downloadDocument(
            Authentication authentication,
            @PathVariable("id") UUID id,
            @PathVariable("filename") String filename,
            @RequestParam(value = "preview", defaultValue = "false") boolean preview) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        var opt = certificateRequestRepository.findByIdAndUser(id, user);
        if (opt.isEmpty()) return ResponseEntity.status(404).build();
        var req = opt.get();
        if (req.getDocuments() == null || !Arrays.asList(req.getDocuments().split(",")).contains(filename)) {
            return ResponseEntity.status(404).build();
        }

        Path path = uploadRoot().resolve(Paths.get("certificate_requests", id.toString(), filename));
        if (!Files.exists(path)) return ResponseEntity.status(404).build();
        try {
            Resource resource = new UrlResource(path.toUri());
            String contentType = "application/octet-stream";
            if (filename.endsWith(".pdf")) contentType = "application/pdf";
            else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (filename.endsWith(".png")) contentType = "image/png";
            else if (filename.endsWith(".gif")) contentType = "image/gif";
            else if (filename.endsWith(".txt")) contentType = "text/plain";
            String disposition = preview ? "inline" : "attachment";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception ex) {
            log.error("Error downloading document {} for request {}", filename, id, ex);
            return ResponseEntity.status(500).body(Map.of("error", "Erreur serveur"));
        }
    }

    @PostMapping("/certificate-requests/{requestId}/validate-token")
    public ResponseEntity<?> validateToken(
            Authentication authentication,
            @PathVariable("requestId") UUID requestId,
            @RequestParam(value = "token") String token) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();

        var opt = certificateRequestRepository.findById(requestId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Request not found"));
        CertificateRequest req = opt.get();

        if (!req.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
        }
        if (!"ISSUED".equalsIgnoreCase(req.getStatus())) {
            return ResponseEntity.status(400).body(Map.of("error", "Request is not in ISSUED state"));
        }
        if (req.getValidationToken() == null || !req.getValidationToken().equals(token)) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid token"));
        }
        if (req.getTokenExpiresAt() != null && LocalDateTime.now().isAfter(req.getTokenExpiresAt())) {
            return ResponseEntity.status(400).body(Map.of("error", "Token expired"));
        }
        if (req.getTokenUsedAt() != null) {
            return ResponseEntity.status(400).body(Map.of("error", "Token already used"));
        }

        req.setTokenUsedAt(LocalDateTime.now());
        certificateRequestRepository.save(req);

        var cert = certificateRepository.findFirstByRequestId(req.getId());
        if (cert.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Certificate not found"));
        Certificate certificate = cert.get();

        auditService.log(user, cm.gov.pki.entity.AuditLog.Actions.TOKEN_VALIDATED, "Certificate", certificate.getId(), null);

        return ResponseEntity.ok(Map.of(
                "certificateId", certificate.getId().toString(),
                "certificate", certificate.getCertificatePem(),
                "fingerprint", certificate.getFingerprintSha256(),
                "issuedAt", certificate.getIssuedAt(),
                "expiresAt", certificate.getNotAfter()
        ));
    }

    @GetMapping("/certificates/{certificateId}/download")
    public ResponseEntity<?> downloadCertificate(
            Authentication authentication,
            @PathVariable("certificateId") UUID certificateId,
            @RequestParam(value = "format", defaultValue = "pem") String format,
            @RequestParam(value = "password", required = false) String password) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        var certOpt = certificateRepository.findById(certificateId);
        if (certOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Certificate not found"));
        Certificate certificate = certOpt.get();
        if (!certificate.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
        }

        String fileName;
        String contentType;
        byte[] contentBytes;
        if ("pem".equalsIgnoreCase(format)) {
            fileName = "certificate-" + certificateId + ".pem";
            contentType = "application/x-pem-file";
            contentBytes = certificate.getCertificatePem().getBytes(StandardCharsets.UTF_8);
        } else if ("crt".equalsIgnoreCase(format)) {
            fileName = "certificate-" + certificateId + ".crt";
            contentType = "application/x-x509-ca-cert";
            contentBytes = certificate.getCertificatePem().getBytes(StandardCharsets.UTF_8);
        } else if ("p12".equalsIgnoreCase(format) || "pfx".equalsIgnoreCase(format)) {
            return ResponseEntity.status(405).body(Map.of(
                    "error",
                    "L'export .p12/.pfx doit utiliser POST /user/certificates/{certificateId}/download-p12."
            ));
        } else {
            return ResponseEntity.status(400).body(Map.of("error", "Format invalide. Utilisez pem, crt ou p12."));
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentBytes.length))
                .body(contentBytes);
    }

    @PostMapping("/certificates/{certificateId}/download-p12")
    public ResponseEntity<?> downloadCertificateP12(
            Authentication authentication,
            @PathVariable("certificateId") UUID certificateId) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        var certOpt = certificateRepository.findById(certificateId);
        if (certOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Certificat introuvable."));
        Certificate certificate = certOpt.get();
        if (!certificate.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès non autorisé."));
        }
        if (certificate.getPrivateKeyPem() == null || certificate.getPrivateKeyPem().isBlank()) {
            return ResponseEntity.status(400).body(Map.of(
                    "error", "Export .p12 indisponible — la clé privée n'est pas stockée sur le serveur (CSR fourni par l'utilisateur)."
            ));
        }

        String password = generateP12Password();
        byte[] p12Bytes = caService.buildPkcs12(
                certificate.getCertificatePem(),
                certificate.getPrivateKeyPem(),
                password,
                "cert-" + certificate.getId()
        );

        String emailBody = String.format(
            "Bonjour %s %s,\n\n" +
            "Votre fichier de certificat PKCS#12 (.p12) vient d'être généré.\n\n" +
            "Mot de passe de protection : %s\n\n" +
            "Conservez ce mot de passe en lieu sûr — il est nécessaire pour importer votre certificat.\n\n" +
            "Cordialement,\n" +
            "Autorité de Certification Souveraine",
            user.getFirstName(), user.getLastName(), password
        );
        boolean sent = emailService.sendSimpleEmail(user.getEmail(), "Mot de passe de votre fichier .p12 — PKI Souverain", emailBody);
        if (!sent) {
            log.warn("Impossible d'envoyer l'email du mot de passe .p12 à {}", user.getEmail());
        }

        String p12Base64 = Base64.getEncoder().encodeToString(p12Bytes);
        return ResponseEntity.ok(Map.of(
                "p12Base64", p12Base64,
                "password", password,
                "emailSent", sent,
                "filename", "certificate-" + certificateId + ".p12"
        ));
    }

    private static String generateP12Password() {
        // Mélange de majuscules, minuscules, chiffres et caractères spéciaux (évite les ambiguïtés 0/O, 1/l/I)
        String upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower   = "abcdefghjkmnpqrstuvwxyz";
        String digits  = "23456789";
        String special = "@#$!%&*";
        String all     = upper + lower + digits + special;
        SecureRandom rnd = new SecureRandom();
        char[] pwd = new char[16];
        // Garantir au moins un caractère de chaque catégorie
        pwd[0]  = upper.charAt(rnd.nextInt(upper.length()));
        pwd[1]  = lower.charAt(rnd.nextInt(lower.length()));
        pwd[2]  = digits.charAt(rnd.nextInt(digits.length()));
        pwd[3]  = special.charAt(rnd.nextInt(special.length()));
        for (int i = 4; i < 16; i++) pwd[i] = all.charAt(rnd.nextInt(all.length()));
        // Mélanger
        for (int i = 15; i > 0; i--) {
            int j = rnd.nextInt(i + 1);
            char tmp = pwd[i]; pwd[i] = pwd[j]; pwd[j] = tmp;
        }
        return new String(pwd);
    }

    @PostMapping("/certificates/{certificateId}/revoke")
    public ResponseEntity<?> revokeCertificate(
            Authentication authentication,
            @PathVariable("certificateId") UUID certificateId,
            @RequestParam(value = "reason", required = false) String reason) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        var certOpt = certificateRepository.findById(certificateId);
        if (certOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Certificate not found"));
        Certificate certificate = certOpt.get();
        if (!certificate.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
        }
        if (certificate.getStatus() == Certificate.CertificateStatus.REVOKED) {
            return ResponseEntity.status(400).body(Map.of("error", "Certificate already revoked"));
        }
        caService.revokeCertificate(certificateId, reason == null ? "revocation_requested_by_user" : reason, user);
        auditService.log(user, cm.gov.pki.entity.AuditLog.Actions.CERTIFICATE_REVOKED, "Certificate", certificateId,
                Map.of("reason", reason));
        return ResponseEntity.ok(Map.of("status", "revoked"));
    }

    @PostMapping("/certificates/{certificateId}/renew")
    public ResponseEntity<?> renewCertificate(
            Authentication authentication,
            @PathVariable("certificateId") UUID certificateId) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        var certOpt = certificateRepository.findById(certificateId);
        if (certOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Certificate not found"));
        Certificate cert = certOpt.get();
        if (!cert.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
        }

        CertificateRequest req = new CertificateRequest();
        req.setUser(user);
        req.setEmail(user.getEmail());
        req.setFirstName(user.getFirstName());
        req.setLastName(user.getLastName());
        req.setStatus("PENDING_REVIEW");
        req.setSubmittedAt(LocalDateTime.now());
        req.setNotes("RENEWAL_OF:" + certificateId);
        req.setDocuments("");

        if (cert.getRequest() != null) {
            CertificateRequest prev = cert.getRequest();
            req.setCommonName(prev.getCommonName());
            req.setOrganization(prev.getOrganization());
            req.setOrganizationalUnit(prev.getOrganizationalUnit());
            req.setLocality(prev.getLocality());
            req.setState(prev.getState());
            req.setCountry(prev.getCountry());
            req.setBirthDate(prev.getBirthDate());
            req.setBirthPlace(prev.getBirthPlace());
            req.setNationality(prev.getNationality());
            req.setIdentityDocumentType(prev.getIdentityDocumentType());
            req.setIdentityDocumentNumber(prev.getIdentityDocumentNumber());
            req.setIdentityDocumentExpiry(prev.getIdentityDocumentExpiry());
        } else {
            String subject = cert.getSubjectDN();
            req.setCommonName(getDnValue(subject, "CN"));
            req.setOrganization(getDnValue(subject, "O"));
            req.setOrganizationalUnit(getDnValue(subject, "OU"));
            req.setLocality(getDnValue(subject, "L"));
            req.setState(getDnValue(subject, "ST"));
            req.setCountry(getDnValue(subject, "C"));
        }

        String validationError = validateBaseRequest(req);
        if (validationError != null) {
            return ResponseEntity.status(400).body(Map.of("error", validationError));
        }

        req = certificateRequestRepository.save(req);
        auditService.log(user, cm.gov.pki.entity.AuditLog.Actions.CERTIFICATE_RENEWED, "CertificateRequest", req.getId(),
                Map.of("renewalOf", certificateId.toString()));

        return ResponseEntity.ok(Map.of(
                "requestId", req.getId().toString(),
                "status", req.getStatus(),
                "message", "Demande de renouvellement creee"
        ));
    }

    @GetMapping("/crl")
    public ResponseEntity<?> downloadCrl() throws Exception {
        var ca = caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
                .orElseThrow(() -> new RuntimeException("No active CA found"));
        if (ca.caCrlPath == null) {
            String crl = caService.generateCRL(ca);
            return ResponseEntity.ok(crl);
        }
        java.nio.file.Path p = java.nio.file.Path.of(ca.caCrlPath);
        String content = java.nio.file.Files.readString(p);
        return ResponseEntity.ok(content);
    }

    private String validateBaseRequest(CertificateRequest req) {
        if (req.getCommonName() == null || req.getCommonName().isBlank()) return "Common Name (CN) est requis";
        if (req.getOrganization() == null || req.getOrganization().isBlank()) return "Organisation (O) est requise";
        if (req.getLocality() == null || req.getLocality().isBlank()) return "Ville (L) est requise";
        if (req.getCountry() == null || !req.getCountry().matches("^[A-Za-z]{2}$")) return "Pays (C) doit etre un code ISO 2 lettres";
        if (req.getEmail() == null || !req.getEmail().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) return "Email invalide";
        return null;
    }

    private String getDnValue(String subject, String key) {
        if (subject == null || subject.isBlank()) return null;
        String[] parts = subject.split(",");
        for (String p : parts) {
            String trimmed = p.trim();
            if (trimmed.startsWith(key + "=")) {
                return trimmed.substring((key + "=").length()).trim();
            }
        }
        return null;
    }

    private java.time.LocalDate parseOptionalDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return java.time.LocalDate.parse(value);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String readCsrInput(String csr, MultipartFile csrFile) {
        String csrContent = csr;
        if (csrContent != null && csrContent.length() > MAX_CSR_SIZE) {
            throw new IllegalArgumentException("CSR trop volumineux (>200KB)");
        }
        if ((csrContent == null || csrContent.isBlank()) && csrFile != null && !csrFile.isEmpty()) {
            if (csrFile.getSize() > MAX_CSR_SIZE) {
                throw new IllegalArgumentException("CSR trop volumineux (>200KB)");
            }
            try (InputStream in = csrFile.getInputStream()) {
                csrContent = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            } catch (IOException ex) {
                throw new IllegalArgumentException("Impossible de lire le fichier CSR");
            }
        }
        return csrContent == null ? null : csrContent.trim();
    }

    private String joinNonBlank(String... values) {
        List<String> result = new ArrayList<>();
        for (String value : values) {
            if (value == null || value.isBlank()) continue;
            for (String part : value.split(",")) {
                if (!part.isBlank()) result.add(part.trim());
            }
        }
        return String.join(",", result);
    }

    private String saveDocuments(UUID requestId, MultipartFile[] documents, String expectedIdentityType) {
        if (documents == null || documents.length == 0) return "";
        List<String> invalid = new ArrayList<>();
        for (MultipartFile f : documents) {
            if (f == null || f.isEmpty()) continue;
            if (f.getSize() > MAX_FILE_SIZE) {
                invalid.add(f.getOriginalFilename() == null ? "file" : f.getOriginalFilename());
                continue;
            }
            try {
                validateDocumentFile(f, expectedIdentityType);
            } catch (IllegalArgumentException ex) {
                invalid.add((f.getOriginalFilename() == null ? "file" : f.getOriginalFilename()) + ": " + ex.getMessage());
            }
        }
        if (!invalid.isEmpty()) {
            throw new IllegalArgumentException("Documents invalides: " + String.join("; ", invalid));
        }

        try {
            Path base = uploadRoot().resolve(Paths.get("certificate_requests", requestId.toString()));
            Files.createDirectories(base);
            List<String> saved = new ArrayList<>();
            for (MultipartFile f : documents) {
                if (f == null || f.isEmpty()) continue;
                String original = f.getOriginalFilename();
                String baseName = (original == null) ? "file" : Paths.get(original).getFileName().toString();
                String safeBase = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");
                String safeName = UUID.randomUUID() + "_" + safeBase;
                Path target = base.resolve(safeName);
                try (InputStream in = f.getInputStream()) {
                    Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                }
                saved.add(safeName);
            }
            return String.join(",", saved);
        } catch (Exception ex) {
            log.error("Error saving documents for request {}", requestId, ex);
            throw new RuntimeException("Erreur technique lors de l'enregistrement des fichiers", ex);
        }
    }

    private String saveSelfie(UUID requestId, MultipartFile selfie) {
        if (selfie == null || selfie.isEmpty()) return "";
        validateSelfieFile(selfie);

        try {
            Path base = uploadRoot().resolve(Paths.get("certificate_requests", requestId.toString()));
            Files.createDirectories(base);
            String original = selfie.getOriginalFilename();
            String baseName = (original == null) ? "selfie" : Paths.get(original).getFileName().toString();
            String safeBase = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String safeName = "selfie_" + UUID.randomUUID() + "_" + safeBase;
            Path target = base.resolve(safeName);
            try (InputStream in = selfie.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return safeName;
        } catch (Exception ex) {
            log.error("Error saving selfie for request {}", requestId, ex);
            throw new RuntimeException("Erreur technique lors de l'enregistrement du selfie", ex);
        }
    }

    private void validateDocumentFile(MultipartFile file, String expectedIdentityType) {
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String ext = extensionOf(original);
        String expectedMime = ALLOWED_EXTENSIONS.get(ext);
        if (expectedMime == null) {
            throw new IllegalArgumentException("extension non autorisee");
        }

        String declaredMime = normalizeMime(file.getContentType());
        if (!ALLOWED_TYPES.contains(declaredMime) || !declaredMime.equals(expectedMime)) {
            throw new IllegalArgumentException("type MIME non autorise");
        }

        String detectedMime = detectMimeBySignature(file);
        if (!expectedMime.equals(detectedMime)) {
            throw new IllegalArgumentException("signature fichier invalide");
        }

        IdentityDocumentAiService.ValidationResult aiResult =
                identityDocumentAiService.validateIdentityDocument(file, expectedIdentityType);
        if (!aiResult.accepted()) {
            throw new IllegalArgumentException("validation IA refusee: " + aiResult.message());
        }
    }

    private void validateSelfieFile(MultipartFile file) {
        if (file.getSize() > MAX_SELFIE_SIZE) {
            throw new IllegalArgumentException("Selfie trop volumineux (>10MB)");
        }

        String original = file.getOriginalFilename() == null ? "selfie" : file.getOriginalFilename();
        String ext = extensionOf(original);
        String expectedMime = ALLOWED_EXTENSIONS.get(ext);
        if (expectedMime == null || !expectedMime.startsWith("image/")) {
            throw new IllegalArgumentException("Selfie: extension image non autorisee");
        }

        String declaredMime = normalizeMime(file.getContentType());
        if (!declaredMime.startsWith("image/") || !declaredMime.equals(expectedMime)) {
            throw new IllegalArgumentException("Selfie: type MIME non autorise");
        }

        String detectedMime = detectMimeBySignature(file);
        if (!expectedMime.equals(detectedMime)) {
            throw new IllegalArgumentException("Selfie: signature fichier invalide");
        }
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String normalizeMime(String mime) {
        if (mime == null) return "";
        String value = mime.toLowerCase(Locale.ROOT).split(";", 2)[0].trim();
        return "image/jpg".equals(value) ? "image/jpeg" : value;
    }

    private static String detectMimeBySignature(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            byte[] header = in.readNBytes(16);
            if (header.length >= 4
                    && header[0] == 0x25
                    && header[1] == 0x50
                    && header[2] == 0x44
                    && header[3] == 0x46) {
                return "application/pdf";
            }
            if (header.length >= 8
                    && (header[0] & 0xFF) == 0x89
                    && header[1] == 0x50
                    && header[2] == 0x4E
                    && header[3] == 0x47
                    && header[4] == 0x0D
                    && header[5] == 0x0A
                    && header[6] == 0x1A
                    && header[7] == 0x0A) {
                return "image/png";
            }
            if (header.length >= 3
                    && (header[0] & 0xFF) == 0xFF
                    && (header[1] & 0xFF) == 0xD8
                    && (header[2] & 0xFF) == 0xFF) {
                return "image/jpeg";
            }
            if (header.length >= 12
                    && header[0] == 0x52
                    && header[1] == 0x49
                    && header[2] == 0x46
                    && header[3] == 0x46
                    && header[8] == 0x57
                    && header[9] == 0x45
                    && header[10] == 0x42
                    && header[11] == 0x50) {
                return "image/webp";
            }
        } catch (IOException ignored) {
            return "";
        }
        return "";
    }

    public static class CertificateDTO {
        private String id;
        private String serialNumber;
        private String subjectDN;
        private String issuerDN;
        private String status;
        private String notBefore;
        private String notAfter;
        private String certificatePem;
        private boolean hasPrivateKey;

        public CertificateDTO() {}

        public CertificateDTO(Certificate cert) {
            this.id = cert.getId().toString();
            this.serialNumber = cert.getSerialNumber();
            this.subjectDN = cert.getSubjectDN();
            this.issuerDN = cert.getIssuerDN();
            this.status = cert.getStatus().name();
            this.notBefore = cert.getNotBefore() != null ? cert.getNotBefore().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
            this.notAfter = cert.getNotAfter() != null ? cert.getNotAfter().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
            this.certificatePem = cert.getCertificatePem();
            this.hasPrivateKey = cert.getPrivateKeyPem() != null && !cert.getPrivateKeyPem().isBlank();
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getSerialNumber() { return serialNumber; }
        public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
        public String getSubjectDN() { return subjectDN; }
        public void setSubjectDN(String subjectDN) { this.subjectDN = subjectDN; }
        public String getIssuerDN() { return issuerDN; }
        public void setIssuerDN(String issuerDN) { this.issuerDN = issuerDN; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getNotBefore() { return notBefore; }
        public void setNotBefore(String notBefore) { this.notBefore = notBefore; }
        public String getNotAfter() { return notAfter; }
        public void setNotAfter(String notAfter) { this.notAfter = notAfter; }
        public String getCertificatePem() { return certificatePem; }
        public void setCertificatePem(String certificatePem) { this.certificatePem = certificatePem; }
        public boolean isHasPrivateKey() { return hasPrivateKey; }
        public void setHasPrivateKey(boolean hasPrivateKey) { this.hasPrivateKey = hasPrivateKey; }
    }

    public static class CertificateRequestDTO {
        private String id;
        private String commonName;
        private String organization;
        private String organizationalUnit;
        private String locality;
        private String state;
        private String country;
        private String email;
        private String firstName;
        private String lastName;
        private String birthDate;
        private String birthPlace;
        private String nationality;
        private String identityDocumentType;
        private String identityDocumentNumber;
        private String identityDocumentExpiry;
        private String status;
        private String submittedAt;
        private String rejectionReason;
        private String[] documents;
        private String notes;

        public CertificateRequestDTO() {}

        public CertificateRequestDTO(CertificateRequest r) {
            this.id = r.getId().toString();
            this.commonName = r.getCommonName();
            this.organization = r.getOrganization();
            this.organizationalUnit = r.getOrganizationalUnit();
            this.locality = r.getLocality();
            this.state = r.getState();
            this.country = r.getCountry();
            this.email = r.getEmail();
            this.firstName = r.getFirstName();
            this.lastName = r.getLastName();
            this.birthDate = r.getBirthDate() != null ? r.getBirthDate().toString() : null;
            this.birthPlace = r.getBirthPlace();
            this.nationality = r.getNationality();
            this.identityDocumentType = r.getIdentityDocumentType();
            this.identityDocumentNumber = r.getIdentityDocumentNumber();
            this.identityDocumentExpiry = r.getIdentityDocumentExpiry() != null ? r.getIdentityDocumentExpiry().toString() : null;
            this.status = r.getStatus();
            this.submittedAt = r.getSubmittedAt() != null ? r.getSubmittedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
            this.rejectionReason = r.getRejectionReason();
            this.documents = r.getDocuments() != null && !r.getDocuments().isBlank() ? r.getDocuments().split(",") : new String[0];
            this.notes = r.getNotes();
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
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
        public String getBirthDate() { return birthDate; }
        public void setBirthDate(String birthDate) { this.birthDate = birthDate; }
        public String getBirthPlace() { return birthPlace; }
        public void setBirthPlace(String birthPlace) { this.birthPlace = birthPlace; }
        public String getNationality() { return nationality; }
        public void setNationality(String nationality) { this.nationality = nationality; }
        public String getIdentityDocumentType() { return identityDocumentType; }
        public void setIdentityDocumentType(String identityDocumentType) { this.identityDocumentType = identityDocumentType; }
        public String getIdentityDocumentNumber() { return identityDocumentNumber; }
        public void setIdentityDocumentNumber(String identityDocumentNumber) { this.identityDocumentNumber = identityDocumentNumber; }
        public String getIdentityDocumentExpiry() { return identityDocumentExpiry; }
        public void setIdentityDocumentExpiry(String identityDocumentExpiry) { this.identityDocumentExpiry = identityDocumentExpiry; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }
        public String getRejectionReason() { return rejectionReason; }
        public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
        public String[] getDocuments() { return documents; }
        public void setDocuments(String[] documents) { this.documents = documents; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}
