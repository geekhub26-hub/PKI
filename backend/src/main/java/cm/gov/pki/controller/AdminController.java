package cm.gov.pki.controller;

import cm.gov.pki.entity.CAConfiguration;
import cm.gov.pki.entity.Certificate;
import cm.gov.pki.repository.CAConfigurationRepository;
import cm.gov.pki.repository.CertificateRepository;
import cm.gov.pki.repository.CertificateRequestRepository;
import cm.gov.pki.repository.UserRepository;
import cm.gov.pki.repository.AuditLogRepository;
import cm.gov.pki.service.CAService;
import cm.gov.pki.service.AuditService;
import cm.gov.pki.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.KeyStore;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
public class AdminController {

	private static final Logger log = LoggerFactory.getLogger(AdminController.class);

	private final CAConfigurationRepository caConfigurationRepository;
	private final UserRepository userRepository;
	private final CertificateRepository certificateRepository;
		private final CertificateRequestRepository certificateRequestRepository;
		private final CAService caService;
		private final EmailService emailService;
		private final AuditService auditService;
		private final AuditLogRepository auditLogRepository;

		private java.nio.file.Path uploadRoot() {
			String configured = System.getenv("PKI_UPLOAD_DIR");
			if (configured != null && !configured.isBlank()) {
				return java.nio.file.Paths.get(configured);
			}
			return java.nio.file.Paths.get(System.getProperty("user.dir"), "uploads");
		}

	public AdminController(CAConfigurationRepository caConfigurationRepository,
						   UserRepository userRepository,
						   CertificateRepository certificateRepository,
						   CertificateRequestRepository certificateRequestRepository,
						   CAService caService,
						   EmailService emailService,
						   AuditService auditService,
						   AuditLogRepository auditLogRepository) {
		this.caConfigurationRepository = caConfigurationRepository;
		this.userRepository = userRepository;
		this.certificateRepository = certificateRepository;
		this.certificateRequestRepository = certificateRequestRepository;
		this.caService = caService;
		this.emailService = emailService;
		this.auditService = auditService;
		this.auditLogRepository = auditLogRepository;
	}

	@GetMapping({"/ca-status", "/ca/status"})
	public ResponseEntity<CAConfiguration> getCaStatus() {
		return caConfigurationRepository.findTopByOrderByCreatedAtDesc()
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@GetMapping("/stats")
	public ResponseEntity<Map<String, Object>> stats(Authentication authentication) {
		Map<String, Object> m = new HashMap<>();
		cm.gov.pki.entity.User caller = callerFrom(authentication);
		java.util.UUID scopeEntiteId = scopeEntiteId(caller);
		if (scopeEntiteId != null) {
			m.put("users", userRepository.countByEntite_Id(scopeEntiteId));
			m.put("certificates", certificateRepository.count());
			m.put("certificateRequests", certificateRequestRepository.countByStatusInAndUser_Entite_Id(
				java.util.List.of("PENDING","PENDING_REVIEW","CSR_SUBMITTED","ISSUED","REJECTED"), scopeEntiteId));
		} else {
			m.put("users", userRepository.count());
			m.put("certificates", certificateRepository.count());
			m.put("certificateRequests", certificateRequestRepository.count());
		}
		m.put("activeCA", caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc().isPresent());
		return ResponseEntity.ok(m);
	}

	@GetMapping("/dashboard")
	public ResponseEntity<Map<String, Object>> getDashboard(Authentication authentication) {
		try {
			Map<String, Object> dashboard = new HashMap<>();
			java.util.UUID scopeId = scopeEntiteId(callerFrom(authentication));

			long totalUsers = scopeId != null
				? userRepository.countByEntite_Id(scopeId)
				: userRepository.count();

			long pendingRequests = scopeId != null
				? certificateRequestRepository.countByStatusInAndUser_Entite_Id(
					java.util.List.of("PENDING", "PENDING_REVIEW", "CSR_SUBMITTED"), scopeId)
				: certificateRequestRepository.countByStatusIn(
					java.util.List.of("PENDING", "PENDING_REVIEW", "CSR_SUBMITTED")
				);
			
			// Compter les certificats actifs
			long activeCertificates = certificateRepository.countByStatus(Certificate.CertificateStatus.ACTIVE);
			
			// Compter les certificats révoqués
			long revokedCertificates = certificateRepository.countByStatus(Certificate.CertificateStatus.REVOKED);
			
			// Récupérer le statut de l'AC
			Map<String, Object> caStatus = new HashMap<>();
			var caOpt = caConfigurationRepository.findTopByOrderByCreatedAtDesc();
			if (caOpt.isPresent()) {
				CAConfiguration ca = caOpt.get();
				caStatus.put("isActive", ca.isActive != null ? ca.isActive : false);
				caStatus.put("isInitialized", true);
				caStatus.put("caName", ca.caName);
				caStatus.put("validFrom", ca.validFrom != null ? ca.validFrom.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
				caStatus.put("validUntil", ca.validUntil != null ? ca.validUntil.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
				
				// Calculer les jours jusqu'à l'expiration
				if (ca.validUntil != null) {
					long daysUntilExpiration = java.time.temporal.ChronoUnit.DAYS.between(
						java.time.LocalDateTime.now(),
						ca.validUntil
					);
					caStatus.put("daysUntilExpiration", daysUntilExpiration);
				}
				caStatus.put("subjectDN", ca.getSubjectDN());
			} else {
				caStatus.put("isActive", false);
				caStatus.put("isInitialized", false);
			}
			
			dashboard.put("totalUsers", totalUsers);
			dashboard.put("pendingRequests", pendingRequests);
			dashboard.put("activeCertificates", activeCertificates);
			dashboard.put("revokedCertificates", revokedCertificates);
			dashboard.put("caStatus", caStatus);
			
			return ResponseEntity.ok(dashboard);
		} catch (Exception ex) {
			log.error("Erreur lors du chargement du dashboard", ex);
			return ResponseEntity.status(500).body(Map.of("error", "Erreur serveur"));
		}
	}

	@PostMapping({"/generate-ca", "/ca/initialize"})
	public ResponseEntity<CAConfiguration> generateCa(@RequestParam(value = "name", defaultValue = "PKI Souverain Root CA") String name) {
		CAConfiguration config = caService.generateRootCA(name, 4096, 3650);
		return ResponseEntity.ok(config);
	}

	@PostMapping(value = "/sign-csr", consumes = "text/plain")
	public ResponseEntity<Map<String, String>> signCsr(@RequestBody String csrPem,
													   @RequestParam(value = "validityDays", defaultValue = "365") int validityDays,
													   @RequestParam(value = "userId", required = false) java.util.UUID userId) {
		String certPem = caService.signCSR(csrPem, validityDays, userId);
		if (userId != null) {
			userRepository.findById(userId).ifPresent(user ->
				auditService.log(user, cm.gov.pki.entity.AuditLog.Actions.CERTIFICATE_ISSUED, "Certificate", null,
					java.util.Map.of("validityDays", validityDays))
			);
		}
		Map<String, String> resp = new HashMap<>();
		resp.put("certificate", certPem);
		return ResponseEntity.ok(resp);
	}

	@PostMapping("/create-keystore")
	public ResponseEntity<Map<String, String>> createKeystore(@RequestParam(value = "password") String password) {
		CAConfiguration ca = caConfigurationRepository.findTopByOrderByCreatedAtDesc().orElseThrow(() -> new RuntimeException("No CA found"));
		java.nio.file.Path ks = caService.createKeystore(ca, password);
		Map<String, String> m = new HashMap<>();
		m.put("keystorePath", ks.toAbsolutePath().toString());
		return ResponseEntity.ok(m);
	}

	@PostMapping("/generate-csr")
	public ResponseEntity<Map<String, String>> generateCsr(
			@RequestParam(value = "cn", defaultValue = "example.com") String cn,
			@RequestParam(value = "o", defaultValue = "Test Organization") String org,
			@RequestParam(value = "c", defaultValue = "CM") String country) {
		String csrPem = caService.generateCSR(cn, org, country);
		Map<String, String> resp = new HashMap<>();
		resp.put("csr", csrPem);
		return ResponseEntity.ok(resp);
	}

	@PostMapping("/generate-intermediate-ca")
	public ResponseEntity<CAConfiguration> generateIntermediateCA(
			@RequestParam(value = "name", defaultValue = "PKI Intermediate CA") String name,
			@RequestParam(value = "keySize", defaultValue = "4096") int keySize,
			@RequestParam(value = "validityDays", defaultValue = "3650") int validityDays) {
		CAConfiguration config = caService.generateIntermediateCA(name, keySize, validityDays);
		return ResponseEntity.ok(config);
	}

	@PostMapping("/generate-crl")
	public ResponseEntity<Map<String, String>> generateCRL() {
		CAConfiguration ca = caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
				.orElseThrow(() -> new RuntimeException("No active CA found"));
		String crlPem = caService.generateCRL(ca);
		java.nio.file.Path crlPath = caService.writeAndPersistCRL(ca);
		auditService.logSystem(cm.gov.pki.entity.AuditLog.Actions.CRL_PUBLISHED, "CAConfiguration", ca.id, java.util.Map.of("type", "generate"));
		Map<String, String> resp = new HashMap<>();
		resp.put("crl", crlPem);
		resp.put("crlPath", crlPath.toAbsolutePath().toString());
		return ResponseEntity.ok(resp);
	}

	@PostMapping("/revoke/{certId}")
	public ResponseEntity<Map<String, String>> revokeCertificate(@PathVariable("certId") java.util.UUID certId,
				@RequestParam(value = "reason", required = false) String reason,
				@RequestParam(value = "adminId", required = false) java.util.UUID adminId) {
		cm.gov.pki.entity.User admin = null;
		if (adminId != null) {
			admin = userRepository.findById(adminId).orElseThrow(() -> new RuntimeException("Admin user not found"));
		} else {
			admin = userRepository.findFirstByRoleOrderByCreatedAtDesc(cm.gov.pki.entity.User.UserRole.ADMIN)
				.orElseThrow(() -> new RuntimeException("No admin user found"));
		}
		caService.revokeCertificate(certId, reason == null ? "unspecified" : reason, admin);
		auditService.log(admin, cm.gov.pki.entity.AuditLog.Actions.CERTIFICATE_REVOKED, "Certificate", certId, java.util.Map.of("reason", reason));
		CAConfiguration ca = caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
				.orElseThrow(() -> new RuntimeException("No active CA found"));
		auditService.logSystem(cm.gov.pki.entity.AuditLog.Actions.CRL_PUBLISHED, "CAConfiguration", ca.id, java.util.Map.of("type", "revoke"));
		Map<String, String> resp = new HashMap<>();
		resp.put("crlPath", ca.caCrlPath);
		return ResponseEntity.ok(resp);
	}

	@GetMapping("/crl")
	public ResponseEntity<String> downloadCrl() throws Exception {
		CAConfiguration ca = caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
			.orElseThrow(() -> new RuntimeException("No active CA found"));
		if (ca.caCrlPath == null) {
			String crl = caService.generateCRL(ca);
			return ResponseEntity.ok(crl);
		}
		java.nio.file.Path p = java.nio.file.Path.of(ca.caCrlPath);
		String content = java.nio.file.Files.readString(p);
		return ResponseEntity.ok(content);
	}

	@PostMapping("/rotate-crl")
	public ResponseEntity<Map<String, String>> rotateCrl() {
		CAConfiguration ca = caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
			.orElseThrow(() -> new RuntimeException("No active CA found"));
		java.nio.file.Path crlPath = caService.writeAndPersistCRL(ca);
		auditService.logSystem(cm.gov.pki.entity.AuditLog.Actions.CRL_PUBLISHED, "CAConfiguration", ca.id, java.util.Map.of("type", "rotate"));
		Map<String, String> resp = new HashMap<>();
		resp.put("crlPath", crlPath.toAbsolutePath().toString());
		return ResponseEntity.ok(resp);
	}

	/**
	 * Restaurer le keystore PKCS12 de l'AC active depuis un fichier uploadé.
	 * Utile quand le disque Render est éphémère et que les bytes ne sont pas en DB.
	 */
	@PostMapping("/ca/restore-keystore")
	public ResponseEntity<?> restoreCaKeystore(
			@RequestParam("file") MultipartFile file,
			@RequestParam("password") String password,
			Authentication authentication) {
		if (!(authentication.getPrincipal() instanceof cm.gov.pki.entity.User admin)) {
			return ResponseEntity.status(401).build();
		}
		CAConfiguration ca = caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
				.orElseThrow(() -> new RuntimeException("Aucune AC active"));
		try {
			byte[] ksBytes = file.getBytes();
			// Valider que c'est un PKCS12 valide avec le mot de passe fourni
			KeyStore ks = KeyStore.getInstance("PKCS12");
			ks.load(new java.io.ByteArrayInputStream(ksBytes), password.toCharArray());
			if (!ks.aliases().hasMoreElements()) {
				return ResponseEntity.badRequest().body(Map.of("error", "Keystore vide ou mot de passe incorrect"));
			}
			// Sauvegarder en DB
			ca.keystoreData = ksBytes;
			caConfigurationRepository.save(ca);
			auditService.log(admin, cm.gov.pki.entity.AuditLog.Actions.CA_INITIALIZED, "CAConfiguration", ca.id,
					java.util.Map.of("action", "RESTORE_KEYSTORE"));
			return ResponseEntity.ok(Map.of("message", "Keystore restauré avec succès pour l'AC : " + ca.caName));
		} catch (Exception e) {
			log.error("Échec restauration keystore", e);
			return ResponseEntity.badRequest().body(Map.of("error", "Keystore invalide ou mot de passe incorrect : " + e.getMessage()));
		}
	}

	@GetMapping("/certificates")
	public ResponseEntity<?> listCertificates(
			@RequestParam(value = "status", required = false) String status,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "20") int size) {

		org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
				Math.max(0, page),
				Math.max(1, size),
				org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "issuedAt")
		);

		org.springframework.data.domain.Page<cm.gov.pki.entity.Certificate> certPage;
		if (status != null && !status.isBlank()) {
			try {
				cm.gov.pki.entity.Certificate.CertificateStatus st =
						cm.gov.pki.entity.Certificate.CertificateStatus.valueOf(status.toUpperCase());
				certPage = certificateRepository.findByStatus(st, pageable);
			} catch (IllegalArgumentException ex) {
				return ResponseEntity.status(400).body(java.util.Map.of("error", "Statut invalide"));
			}
		} else {
			certPage = certificateRepository.findAll(pageable);
		}

		var items = certPage.getContent().stream().map(AdminCertificateDTO::new).toList();
		java.util.Map<String, Object> resp = new java.util.HashMap<>();
		resp.put("items", items);
		resp.put("total", certPage.getTotalElements());
		resp.put("page", certPage.getNumber());
		resp.put("size", certPage.getSize());
		resp.put("totalPages", certPage.getTotalPages());
		return ResponseEntity.ok(resp);
	}

	@GetMapping("/audit-logs")
	public ResponseEntity<?> listAuditLogs(
			@RequestParam(value = "action", required = false) String action,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "20") int size) {
		org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
				Math.max(0, page),
				Math.max(1, size),
				org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")
		);
		org.springframework.data.domain.Page<cm.gov.pki.entity.AuditLog> logPage;
		if (action != null && !action.isBlank()) {
			logPage = auditLogRepository.findByActionOrderByCreatedAtDesc(action, pageable);
		} else {
			logPage = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
		}
		var items = logPage.getContent().stream().map(AdminAuditLogDTO::new).toList();
		java.util.Map<String, Object> resp = new java.util.HashMap<>();
		resp.put("items", items);
		resp.put("total", logPage.getTotalElements());
		resp.put("page", logPage.getNumber());
		resp.put("size", logPage.getSize());
		resp.put("totalPages", logPage.getTotalPages());
		return ResponseEntity.ok(resp);
	}

	@DeleteMapping("/audit-logs/{id}")
	public ResponseEntity<?> deleteAuditLog(
			@PathVariable UUID id,
			Authentication authentication) {
		if (!(authentication.getPrincipal() instanceof cm.gov.pki.entity.User admin)) return ResponseEntity.status(401).build();
		if (!auditLogRepository.existsById(id)) return ResponseEntity.notFound().build();
		auditLogRepository.deleteById(id);
		auditService.log(admin, cm.gov.pki.entity.AuditLog.Actions.USER_LOGIN, "AuditLog", id, java.util.Map.of("action", "DELETE_AUDIT_LOG"));
		return ResponseEntity.noContent().build();
	}

	// --- Certificate request management for admins ---

	@GetMapping("/certificate-requests")
	public ResponseEntity<?> listCertificateRequests(
			Authentication authentication,
			@RequestParam(value = "status", required = false) String status,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "20") int size) {

		org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
			Math.max(0, page), Math.max(1, size),
			org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "submittedAt"));
		java.util.UUID scopeId = scopeEntiteId(callerFrom(authentication));
		org.springframework.data.domain.Page<cm.gov.pki.entity.CertificateRequest> resPage;
		if (scopeId != null) {
			resPage = (status != null && !status.isBlank())
				? certificateRequestRepository.findByUserEntiteIdAndStatus(scopeId, status, pageable)
				: certificateRequestRepository.findByUserEntiteId(scopeId, pageable);
		} else {
			resPage = (status != null && !status.isBlank())
				? certificateRequestRepository.findByStatusIgnoreCase(status.toUpperCase(), pageable)
				: certificateRequestRepository.findAll(pageable);
		}
		var items = resPage.getContent().stream().map(r -> new CertificateRequestAdminDTO(r)).toList();
		java.util.Map<String, Object> resp = new java.util.HashMap<>();
		resp.put("items", items);
		resp.put("total", resPage.getTotalElements());
		resp.put("page", resPage.getNumber());
		resp.put("size", resPage.getSize());
		resp.put("totalPages", resPage.getTotalPages());
		return ResponseEntity.ok(resp);
	}

	@GetMapping("/certificate-requests/{id}")
	public ResponseEntity<?> getCertificateRequest(@PathVariable("id") java.util.UUID id) {
		var opt = certificateRequestRepository.findById(id);
		if (opt.isEmpty()) return ResponseEntity.status(404).build();
		var dto = new CertificateRequestAdminDTO(opt.get());
		return ResponseEntity.ok(dto);
	}

		@GetMapping("/certificate-requests/{id}/documents/{filename}")
		public ResponseEntity<?> adminDownloadDocument(@PathVariable("id") java.util.UUID id, @PathVariable("filename") String filename) {
		var opt = certificateRequestRepository.findById(id);
		if (opt.isEmpty()) return ResponseEntity.status(404).build();
		var req = opt.get();
		if (req.getDocuments() == null || !java.util.Arrays.asList(req.getDocuments().split(",")).contains(filename)) {
			return ResponseEntity.status(404).build();
		}
			java.nio.file.Path path = uploadRoot().resolve(java.nio.file.Paths.get("certificate_requests", id.toString(), filename));
			if (!java.nio.file.Files.exists(path)) return ResponseEntity.status(404).build();
			try {
				org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(path.toUri());
				String contentType = "application/octet-stream";
				String lower = filename.toLowerCase();
				if (lower.endsWith(".pdf")) contentType = "application/pdf";
				else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
				else if (lower.endsWith(".png")) contentType = "image/png";
				else if (lower.endsWith(".gif")) contentType = "image/gif";
				else if (lower.endsWith(".txt")) contentType = "text/plain";
				return ResponseEntity.ok()
						.header(org.springframework.http.HttpHeaders.CONTENT_TYPE, contentType)
						.header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
						.body(resource);
			} catch (java.net.MalformedURLException ex) {
			log.error("URL invalide pour le fichier {} du téléchargement admin {}", filename, id, ex);
			return ResponseEntity.status(400).body(java.util.Map.of("error", "Nom de fichier invalide"));
		} catch (RuntimeException ex) {
			log.error("Erreur lors du chargement de la ressource {} pour la demande {} (admin)", filename, id, ex);
			return ResponseEntity.status(500).body(java.util.Map.of("error", "Erreur serveur"));
		}
	}

	@PostMapping("/certificate-requests/{id}/review-approve")
	public ResponseEntity<?> reviewApprove(Authentication authentication, @PathVariable("id") java.util.UUID id) {
		if (authentication == null || !(authentication.getPrincipal() instanceof cm.gov.pki.entity.User)) {
			return ResponseEntity.status(401).build();
		}
		cm.gov.pki.entity.User admin = (cm.gov.pki.entity.User) authentication.getPrincipal();
		var opt = certificateRequestRepository.findById(id);
		if (opt.isEmpty()) return ResponseEntity.status(404).build();
		var req = opt.get();
		if (!"PENDING_REVIEW".equalsIgnoreCase(req.getStatus()) && !"PENDING".equalsIgnoreCase(req.getStatus())) {
			return ResponseEntity.status(400).body(java.util.Map.of("error", "Request not in review state"));
		}

		req.setStatus(req.getCsrContent() == null || req.getCsrContent().isBlank() ? "REVIEW_APPROVED" : "CSR_SUBMITTED");
		req.setReviewedAt(java.time.LocalDateTime.now());
		req.setReviewedBy(admin);
		req.setRejectionReason(null);
		certificateRequestRepository.save(req);
		auditService.log(admin, cm.gov.pki.entity.AuditLog.Actions.CSR_APPROVED, "CertificateRequest", req.getId(), null);
		return ResponseEntity.ok(java.util.Map.of("status", req.getStatus()));
	}

	@PostMapping("/certificate-requests/{id}/review-reject")
	public ResponseEntity<?> reviewReject(
			Authentication authentication,
			@PathVariable("id") java.util.UUID id,
			@RequestParam(value = "reason", required = false) String reason) {
		if (authentication == null || !(authentication.getPrincipal() instanceof cm.gov.pki.entity.User)) {
			return ResponseEntity.status(401).build();
		}
		cm.gov.pki.entity.User admin = (cm.gov.pki.entity.User) authentication.getPrincipal();
		var opt = certificateRequestRepository.findById(id);
		if (opt.isEmpty()) return ResponseEntity.status(404).build();
		var req = opt.get();
		if (!"PENDING_REVIEW".equalsIgnoreCase(req.getStatus()) && !"PENDING".equalsIgnoreCase(req.getStatus())) {
			return ResponseEntity.status(400).body(java.util.Map.of("error", "Request not in review state"));
		}

		req.setStatus("NEEDS_CORRECTION");
		req.setRejectionReason(reason == null ? "Informations ou pieces insuffisantes." : reason);
		req.setReviewedAt(java.time.LocalDateTime.now());
		req.setReviewedBy(admin);
		certificateRequestRepository.save(req);
		auditService.log(admin, cm.gov.pki.entity.AuditLog.Actions.CSR_REJECTED, "CertificateRequest", req.getId(),
				java.util.Map.of("reason", req.getRejectionReason()));
		return ResponseEntity.ok(java.util.Map.of("status", req.getStatus(), "reason", req.getRejectionReason()));
	}

	@PostMapping("/certificate-requests/{id}/approve")
	public ResponseEntity<?> approveRequest(Authentication authentication, @PathVariable("id") java.util.UUID id,
										@RequestParam(value = "validityDays", defaultValue = "365") int validityDays) {
		if (authentication == null || !(authentication.getPrincipal() instanceof cm.gov.pki.entity.User)) {
			return ResponseEntity.status(401).build();
		}
		cm.gov.pki.entity.User admin = (cm.gov.pki.entity.User) authentication.getPrincipal();
		var opt = certificateRequestRepository.findById(id);
		if (opt.isEmpty()) return ResponseEntity.status(404).build();
		var req = opt.get();
		if (!"CSR_SUBMITTED".equalsIgnoreCase(req.getStatus())) {
			return ResponseEntity.status(400).body(java.util.Map.of("error", "Request must be in CSR_SUBMITTED state"));
		}
		if (req.getCsrContent() == null || req.getCsrContent().isBlank()) {
			return ResponseEntity.status(400).body(java.util.Map.of("error", "No CSR provided for this request"));
		}
		final String certPem;
		try {
			certPem = caService.signCSR(req.getCsrContent(), validityDays, req.getUser().getId(), req.getId());
		} catch (RuntimeException ex) {
			String msg = ex.getMessage() == null ? "" : ex.getMessage();
			log.warn("CSR signing failed for request {}: {}", id, msg);
			if (msg.contains("Aucune AC active trouvée")
					|| msg.contains("ca-store")
					|| msg.contains(".pem")
					|| msg.contains("CA")
					|| msg.contains("AC")) {
				return ResponseEntity.status(400).body(java.util.Map.of(
						"error",
						"Impossible de signer la CSR: AC absente ou non configuree. Veuillez initialiser ou reinitialiser l AC."
				));
			}
			return ResponseEntity.status(400).body(java.util.Map.of(
					"error",
					"Impossible de signer la CSR pour le moment. Veuillez reessayer."
			));
		}
		
		// Générer un token de validation
		String validationToken = java.util.UUID.randomUUID().toString();
		java.time.LocalDateTime tokenExpiresAt = java.time.LocalDateTime.now().plusHours(24);
		
		req.setStatus("ISSUED");
		req.setReviewedAt(java.time.LocalDateTime.now());
		req.setReviewedBy(admin);
		req.setValidationToken(validationToken);
		req.setTokenExpiresAt(tokenExpiresAt);
		certificateRequestRepository.save(req);
		auditService.log(admin, cm.gov.pki.entity.AuditLog.Actions.CERTIFICATE_ISSUED, "CertificateRequest", req.getId(),
				java.util.Map.of("validityDays", validityDays));
		
		// Envoyer email avec le token
		String userName = req.getUser().getFirstName() + " " + req.getUser().getLastName();
		emailService.sendValidationTokenEmail(req.getUser().getEmail(), userName, id, validationToken);
		
		return ResponseEntity.ok(java.util.Map.of("certificate", certPem, "message", "Email de validation envoyé"));
	}

	@PostMapping("/certificate-requests/{id}/reject")
	public ResponseEntity<?> rejectRequest(Authentication authentication, @PathVariable("id") java.util.UUID id,
							@RequestParam(value = "reason", required = false) String reason) {
		if (authentication == null || !(authentication.getPrincipal() instanceof cm.gov.pki.entity.User)) {
			return ResponseEntity.status(401).build();
		}
		cm.gov.pki.entity.User admin = (cm.gov.pki.entity.User) authentication.getPrincipal();
		var opt = certificateRequestRepository.findById(id);
		if (opt.isEmpty()) return ResponseEntity.status(404).build();
		var req = opt.get();
		if (!"CSR_SUBMITTED".equalsIgnoreCase(req.getStatus()) && !"REVIEW_APPROVED".equalsIgnoreCase(req.getStatus())) {
			return ResponseEntity.status(400).body(java.util.Map.of("error", "Request not in CSR review state"));
		}
		req.setStatus("REJECTED");
		req.setRejectionReason(reason == null ? "" : reason);
		req.setReviewedAt(java.time.LocalDateTime.now());
		req.setReviewedBy(admin);
		certificateRequestRepository.save(req);
		auditService.log(admin, cm.gov.pki.entity.AuditLog.Actions.CSR_REJECTED, "CertificateRequest", req.getId(),
				java.util.Map.of("reason", req.getRejectionReason()));
		
		// Envoyer email de rejet
		String userName = req.getUser().getFirstName() + " " + req.getUser().getLastName();
		emailService.sendRejectionEmail(req.getUser().getEmail(), userName, reason);
		
		return ResponseEntity.ok(java.util.Map.of("status", "rejected"));
	}

	@GetMapping("/users")
	public ResponseEntity<?> listUsers(
			Authentication authentication,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "20") int size) {
		try {
			org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
				Math.max(0, page),
				Math.max(1, size),
				org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")
			);
			java.util.UUID scopeId = scopeEntiteId(callerFrom(authentication));
			org.springframework.data.domain.Page<cm.gov.pki.entity.User> usersPage = scopeId != null
				? userRepository.findByEntite_Id(scopeId, pageable)
				: userRepository.findAll(pageable);
			var items = usersPage.getContent().stream().map(u -> new UserAdminDTO(u)).toList();
			java.util.Map<String, Object> resp = new java.util.HashMap<>();
			resp.put("items", items);
			resp.put("total", usersPage.getTotalElements());
			resp.put("page", usersPage.getNumber());
			resp.put("size", usersPage.getSize());
			resp.put("totalPages", usersPage.getTotalPages());
			return ResponseEntity.ok(resp);
		} catch (Exception ex) {
			log.error("Erreur lors de la récupération des utilisateurs", ex);
			return ResponseEntity.status(500).body(java.util.Map.of("error", "Erreur serveur"));
		}
	}

	@DeleteMapping("/users/{userId}")
	public ResponseEntity<?> deleteUser(
			Authentication authentication,
			@PathVariable("userId") java.util.UUID userId) {
		try {
			// Vérifier que l'administrateur n'essaie pas de se supprimer lui-même
			if (authentication != null && authentication.getPrincipal() instanceof cm.gov.pki.entity.User) {
				cm.gov.pki.entity.User admin = (cm.gov.pki.entity.User) authentication.getPrincipal();
				if (admin.getId().equals(userId)) {
					return ResponseEntity.status(400).body(java.util.Map.of("error", "Vous ne pouvez pas supprimer votre propre compte"));
				}
			}

			// Récupérer l'utilisateur à supprimer
			var userOpt = userRepository.findById(userId);
			if (userOpt.isEmpty()) {
				return ResponseEntity.status(404).body(java.util.Map.of("error", "Utilisateur non trouvé"));
			}

			cm.gov.pki.entity.User userToDelete = userOpt.get();

			// Enregistrer dans l'audit
			if (authentication != null && authentication.getPrincipal() instanceof cm.gov.pki.entity.User) {
				cm.gov.pki.entity.User admin = (cm.gov.pki.entity.User) authentication.getPrincipal();
				log.info("Suppression d'utilisateur : {} par {}", userToDelete.getEmail(), admin.getEmail());
			}

			// Supprimer les données de l'utilisateur avant sa suppression
			// Cela évite les contraintes de clé étrangère
			try {
				// Supprimer tous les certificats de cet utilisateur
				var userCertificates = certificateRepository.findByUserOrderByIssuedAtDesc(userToDelete);
				if (userCertificates != null && !userCertificates.isEmpty()) {
					certificateRepository.deleteAll(userCertificates);
					log.info("Suppression de {} certificat(s) pour l'utilisateur {}", userCertificates.size(), userToDelete.getEmail());
				}
				
				// Supprimer toutes les demandes de certificat de cet utilisateur
				var userRequests = certificateRequestRepository.findByUserOrderBySubmittedAtDesc(userToDelete);
				if (userRequests != null && !userRequests.isEmpty()) {
					certificateRequestRepository.deleteAll(userRequests);
					log.info("Suppression de {} demande(s) de certificat pour l'utilisateur {}", userRequests.size(), userToDelete.getEmail());
				}
			} catch (Exception e) {
				log.warn("Erreur lors de la suppression des certificats de l'utilisateur {}: {}", userId, e.getMessage());
				// Continuer malgré l'erreur pour essayer de supprimer l'utilisateur
			}

			// Supprimer l'utilisateur
			userRepository.deleteById(userId);

			return ResponseEntity.ok(java.util.Map.of("message", "Utilisateur supprimé avec succès"));
		} catch (Exception ex) {
			log.error("Erreur lors de la suppression de l'utilisateur {}", userId, ex);
			return ResponseEntity.status(500).body(java.util.Map.of("error", "Erreur serveur: " + ex.getMessage()));
		}
	}

	// ── Export Excel ──────────────────────────────────────────────────────────

	@GetMapping("/certificate-requests/export/excel")
	public ResponseEntity<?> exportRequestsExcel(Authentication authentication) {
		try {
			java.util.UUID scopeId = scopeEntiteId(callerFrom(authentication));
			var all = scopeId != null
				? certificateRequestRepository.findByUserEntiteId(scopeId,
					org.springframework.data.domain.Pageable.unpaged()).getContent()
				: certificateRequestRepository.findAll();

			try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
				org.apache.poi.ss.usermodel.Sheet sheet = wb.createSheet("Demandes");

				org.apache.poi.ss.usermodel.CellStyle hStyle = wb.createCellStyle();
				org.apache.poi.ss.usermodel.Font hFont = wb.createFont();
				hFont.setBold(true);
				hStyle.setFont(hFont);
				hStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.GREY_25_PERCENT.getIndex());
				hStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);

				String[] headers = {"ID", "Demandeur", "Email", "Entité", "Statut", "Soumis le", "Traité le", "Motif rejet"};
				org.apache.poi.ss.usermodel.Row hRow = sheet.createRow(0);
				for (int i = 0; i < headers.length; i++) {
					org.apache.poi.ss.usermodel.Cell c = hRow.createCell(i);
					c.setCellValue(headers[i]);
					c.setCellStyle(hStyle);
				}

				var fmt = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
				int idx = 1;
				for (var r : all) {
					org.apache.poi.ss.usermodel.Row row = sheet.createRow(idx++);
					row.createCell(0).setCellValue(r.getId() != null ? r.getId().toString() : "");
					String nom = r.getUser() != null ? r.getUser().getFirstName() + " " + r.getUser().getLastName() : "";
					row.createCell(1).setCellValue(nom);
					row.createCell(2).setCellValue(r.getUser() != null ? r.getUser().getEmail() : "");
					String entite = r.getUser() != null && r.getUser().getEntite() != null ? r.getUser().getEntite().getNom() : "";
					row.createCell(3).setCellValue(entite);
					row.createCell(4).setCellValue(r.getStatus() != null ? r.getStatus() : "");
					row.createCell(5).setCellValue(r.getSubmittedAt() != null ? r.getSubmittedAt().format(fmt) : "");
					row.createCell(6).setCellValue(r.getReviewedAt() != null ? r.getReviewedAt().format(fmt) : "");
					row.createCell(7).setCellValue(r.getRejectionReason() != null ? r.getRejectionReason() : "");
				}
				for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

				java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
				wb.write(out);
				return ResponseEntity.ok()
					.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
					.header("Content-Disposition", "attachment; filename=\"demandes.xlsx\"")
					.body(out.toByteArray());
			}
		} catch (Exception ex) {
			log.error("Erreur export Excel demandes", ex);
			return ResponseEntity.status(500).body(java.util.Map.of("error", "Erreur export"));
		}
	}

	// ── Stats avancées ────────────────────────────────────────────────────────

	@GetMapping("/stats/advanced")
	public ResponseEntity<?> advancedStats(
			Authentication authentication,
			@RequestParam(value = "from", required = false) String fromStr,
			@RequestParam(value = "to", required = false) String toStr,
			@RequestParam(value = "entiteId", required = false) java.util.UUID entiteId) {
		try {
			java.time.LocalDateTime from = fromStr != null
				? java.time.LocalDate.parse(fromStr).atStartOfDay() : null;
			java.time.LocalDateTime to = toStr != null
				? java.time.LocalDate.parse(toStr).atTime(23, 59, 59) : null;

			// Appliquer le scope entité de l'appelant si non SUPER_ADMIN
			java.util.UUID scopeId = scopeEntiteId(callerFrom(authentication));
			if (scopeId != null) entiteId = scopeId;

			// Répartition par statut
			java.util.Map<String, Long> parStatut = new java.util.LinkedHashMap<>();
			for (Object[] row : certificateRequestRepository.countByStatusGrouped(from, to, entiteId)) {
				parStatut.put((String) row[0], (Long) row[1]);
			}

			// Délai moyen de traitement (heures)
			Double avgH = certificateRequestRepository.avgProcessingHours(from, to);

			// Top 5 entités
			var top5Pageable = org.springframework.data.domain.PageRequest.of(0, 5);
			java.util.List<java.util.Map<String, Object>> top5 = new java.util.ArrayList<>();
			for (Object[] row : certificateRequestRepository.top5EntitesByRequests(from, to, top5Pageable)) {
				java.util.Map<String, Object> e = new java.util.LinkedHashMap<>();
				e.put("entite", row[0]);
				e.put("count", row[1]);
				top5.add(e);
			}

			java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
			result.put("parStatut", parStatut);
			result.put("delaiMoyenHeures", avgH != null ? Math.round(avgH * 10.0) / 10.0 : null);
			result.put("top5Entites", top5);
			return ResponseEntity.ok(result);
		} catch (Exception ex) {
			log.error("Erreur stats avancées", ex);
			return ResponseEntity.status(500).body(java.util.Map.of("error", "Erreur serveur"));
		}
	}

	// ── Helpers isolation entité ──────────────────────────────────────────────

	private cm.gov.pki.entity.User callerFrom(Authentication authentication) {
		if (authentication != null && authentication.getPrincipal() instanceof cm.gov.pki.entity.User u) return u;
		return null;
	}

	/** Retourne l'entite_id à utiliser comme scope, ou null si l'utilisateur voit tout. */
	private java.util.UUID scopeEntiteId(cm.gov.pki.entity.User caller) {
		if (caller == null) return null;
		cm.gov.pki.entity.User.UserRole role = caller.getRole();
		if (role == cm.gov.pki.entity.User.UserRole.SUPER_ADMIN || role == cm.gov.pki.entity.User.UserRole.ADMIN) return null;
		return caller.getEntite() != null ? caller.getEntite().getId() : null;
	}

	// DTO for admin user management
	public static class UserAdminDTO {
		public String id;
		public String email;
		public String firstName;
		public String lastName;
		public String role;
		public Boolean isActive;
		public Boolean emailVerified;
		public String createdAt;
		public String lastLogin;

		public UserAdminDTO(cm.gov.pki.entity.User u) {
			this.id = u.getId().toString();
			this.email = u.getEmail();
			this.firstName = u.getFirstName();
			this.lastName = u.getLastName();
			this.role = u.getRole().name();
			this.isActive = u.getIsActive();
			this.emailVerified = u.getEmailVerified();
			this.createdAt = u.getCreatedAt() != null ? u.getCreatedAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
			this.lastLogin = u.getLastLogin() != null ? u.getLastLogin().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
		}
	}

	// DTO for admin listing/detail
	public static class CertificateRequestAdminDTO {
		public String id;
		public String userId;
		public String userEmail;
		public String userFullName;
		public String commonName;
		public String organization;
		public String organizationalUnit;
		public String locality;
		public String state;
		public String country;
		public String email;
		public String firstName;
		public String lastName;
		public String birthDate;
		public String birthPlace;
		public String nationality;
		public String identityDocumentType;
		public String identityDocumentNumber;
		public String identityDocumentExpiry;
		public String status;
		public String submittedAt;
		public String reviewedAt;
		public String reviewedById;
		public String reviewedByEmail;
		public String rejectionReason;
		public String[] documents;
		public String csrContent;
		public String notes;

		public CertificateRequestAdminDTO(cm.gov.pki.entity.CertificateRequest r) {
			this.id = r.getId().toString();
			this.userId = r.getUser() != null ? r.getUser().getId().toString() : null;
			this.userEmail = r.getUser() != null ? r.getUser().getEmail() : null;
			this.userFullName = r.getUser() != null ? r.getUser().getFirstName() + " " + r.getUser().getLastName() : null;
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
			this.submittedAt = r.getSubmittedAt() != null ? r.getSubmittedAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
			this.reviewedAt = r.getReviewedAt() != null ? r.getReviewedAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
			this.reviewedById = r.getReviewedBy() != null ? r.getReviewedBy().getId().toString() : null;
			this.reviewedByEmail = r.getReviewedBy() != null ? r.getReviewedBy().getEmail() : null;
			this.rejectionReason = r.getRejectionReason();
			this.documents = r.getDocuments() != null ? r.getDocuments().split(",") : new String[0];
			this.csrContent = r.getCsrContent();
			this.notes = r.getNotes();
		}
	}

	// DTO for admin certificate listing
	public static class AdminCertificateDTO {
		public String id;
		public String userId;
		public String userEmail;
		public String serialNumber;
		public String subjectDN;
		public String issuerDN;
		public String status;
		public String issuedAt;
		public String notAfter;
		public String revokedAt;
		public String revocationReason;

		public AdminCertificateDTO(cm.gov.pki.entity.Certificate c) {
			this.id = c.getId() != null ? c.getId().toString() : null;
			this.userId = c.getUser() != null ? c.getUser().getId().toString() : null;
			this.userEmail = c.getUser() != null ? c.getUser().getEmail() : null;
			this.serialNumber = c.getSerialNumber();
			this.subjectDN = c.getSubjectDN();
			this.issuerDN = c.getIssuerDN();
			this.status = c.getStatus() != null ? c.getStatus().name() : null;
			this.issuedAt = c.getIssuedAt() != null ? c.getIssuedAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
			this.notAfter = c.getNotAfter() != null ? c.getNotAfter().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
			this.revokedAt = c.getRevokedAt() != null ? c.getRevokedAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
			this.revocationReason = c.getRevocationReason();
		}
	}

	public static class AdminAuditLogDTO {
		public String id;
		public String userEmail;
		public String action;
		public String entityType;
		public String entityId;
		public Object details;
		public String createdAt;

		public AdminAuditLogDTO(cm.gov.pki.entity.AuditLog log) {
			this.id = log.getId() != null ? log.getId().toString() : null;
			this.userEmail = log.getUser() != null ? log.getUser().getEmail() : null;
			this.action = log.getAction();
			this.entityType = log.getEntityType();
			this.entityId = log.getEntityId() != null ? log.getEntityId().toString() : null;
			this.details = log.getDetails();
			this.createdAt = log.getCreatedAt() != null ? log.getCreatedAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
		}
	}
}
