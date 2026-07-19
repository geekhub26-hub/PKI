package cm.gov.pki.controller;

import cm.gov.pki.entity.AuditLog;
import cm.gov.pki.entity.CertificateRequest;
import cm.gov.pki.entity.User;
import cm.gov.pki.repository.CertificateRequestRepository;
import cm.gov.pki.repository.ParametreRepository;
import cm.gov.pki.service.AuditService;
import cm.gov.pki.service.EmailService;
import cm.gov.pki.service.SharePayService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final SharePayService sharePayService;
    private final CertificateRequestRepository requestRepository;
    private final AuditService auditService;
    private final EmailService emailService;
    private final ParametreRepository parametreRepository;

    @Value("${pki.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public PaymentController(
            SharePayService sharePayService,
            CertificateRequestRepository requestRepository,
            AuditService auditService,
            EmailService emailService,
            ParametreRepository parametreRepository
    ) {
        this.sharePayService = sharePayService;
        this.requestRepository = requestRepository;
        this.auditService = auditService;
        this.emailService = emailService;
        this.parametreRepository = parametreRepository;
    }

    /**
     * Initie une session de paiement SharePay pour une demande approuvée.
     * Accessible par l'utilisateur authentifié propriétaire de la demande.
     */
    @PostMapping("/payment/checkout/{requestId}")
    public ResponseEntity<?> initiateCheckout(
            Authentication authentication,
            @PathVariable("requestId") UUID requestId
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(401).build();
        }

        Optional<CertificateRequest> opt = requestRepository.findByIdAndUser(requestId, user);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Demande introuvable."));
        }
        CertificateRequest req = opt.get();

        String status = req.getStatus() == null ? "" : req.getStatus().toUpperCase();
        if (!"REVIEW_APPROVED".equals(status) && !"AWAITING_PAYMENT".equals(status)) {
            return ResponseEntity.status(400).body(Map.of(
                    "error", "Cette demande ne peut pas être payée dans son état actuel (" + req.getStatus() + ")."
            ));
        }

        String successUrl = frontendUrl + "/#/request-pipeline?payment=pending";
        String cancelUrl  = frontendUrl + "/#/request-pipeline?payment=cancelled";

        try {
            SharePayService.CheckoutResult checkout = sharePayService.createCheckout(
                    requestId.toString(), successUrl, cancelUrl);

            req.setSharePayReference(checkout.reference());
            req.setPaymentInitiatedAt(LocalDateTime.now());
            req.setStatus("AWAITING_PAYMENT");
            requestRepository.save(req);

            auditService.log(user, AuditLog.Actions.REQUEST_UPDATED, "CertificateRequest", requestId,
                    Map.of("action", "payment_checkout_created", "reference", checkout.reference()));

            return ResponseEntity.ok(Map.of(
                    "paymentUrl", checkout.paymentUrl(),
                    "reference", checkout.reference()
            ));
        } catch (Exception e) {
            log.error("Erreur création checkout SharePay pour demande {}: {}", requestId, e.getMessage());
            return ResponseEntity.status(502).body(Map.of(
                    "error", "Impossible de créer la session de paiement. Réessayez dans quelques instants."
            ));
        }
    }

    /**
     * Endpoint webhook SharePay (public — pas de JWT).
     * Traite les événements payment.success, payment.failed, payment.cancelled.
     */
    @Transactional
    @PostMapping(value = "/webhook/sharepay", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> handleSharePayWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Sharepay-Signature", required = false) String signature
    ) {
        if (!sharePayService.verifyWebhookSignature(rawBody, signature)) {
            log.warn("Webhook SharePay rejeté — signature invalide");
            return ResponseEntity.status(401).build();
        }

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String event = root.path("event").asText("");
            JsonNode data = root.path("data");
            String reference = data.path("reference").asText("");
            String merchantRef = data.path("merchantReference").asText("");

            log.info("Webhook SharePay reçu: event={} reference={} merchantRef={}", event, reference, merchantRef);

            if (reference.isBlank() && merchantRef.isBlank()) {
                return ResponseEntity.ok().build();
            }

            Optional<CertificateRequest> opt = findRequest(reference, merchantRef);
            if (opt.isEmpty()) {
                log.warn("Webhook SharePay: demande introuvable pour reference={} merchantRef={}", reference, merchantRef);
                return ResponseEntity.ok().build();
            }
            CertificateRequest req = opt.get();

            switch (event) {
                case "payment.success" -> handlePaymentSuccess(req, reference);
                case "payment.failed"  -> handlePaymentFailed(req, event);
                case "payment.cancelled" -> handlePaymentFailed(req, event);
                default -> log.info("Webhook SharePay: événement non traité '{}'", event);
            }
        } catch (Exception e) {
            log.error("Erreur traitement webhook SharePay: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }

    private Optional<CertificateRequest> findRequest(String reference, String merchantRef) {
        if (!reference.isBlank()) {
            Optional<CertificateRequest> found = requestRepository.findBySharePayReference(reference);
            if (found.isPresent()) return found;
        }
        if (!merchantRef.isBlank()) {
            try {
                return requestRepository.findById(UUID.fromString(merchantRef));
            } catch (IllegalArgumentException ignored) {}
        }
        return Optional.empty();
    }

    private void handlePaymentSuccess(CertificateRequest req, String reference) {
        if ("AWAITING_PAYMENT".equalsIgnoreCase(req.getStatus())) {
            req.setStatus("PAYMENT_CONFIRMED");
            req.setSharePayReference(reference);
            requestRepository.save(req);
            log.info("Paiement confirmé pour demande {} (ref={})", req.getId(), reference);

            User user = req.getUser();
            if (user != null) {
                auditService.log(user, AuditLog.Actions.REQUEST_UPDATED, "CertificateRequest", req.getId(),
                        Map.of("action", "payment_confirmed", "reference", reference));
                String body = String.format(
                        "Bonjour %s %s,%n%n" +
                        "Votre paiement a bien été reçu pour la demande de certificat numérique.%n%n" +
                        "Vous pouvez maintenant soumettre votre CSR sur la plateforme PKI Souverain.%n%n" +
                        "Référence de paiement : %s%n%n" +
                        "Cordialement,%nAutorité de Certification Souveraine",
                        user.getFirstName(), user.getLastName(), reference
                );
                emailService.sendSimpleEmail(user.getEmail(),
                        "Paiement confirmé — PKI Souverain", body);
            }
        } else {
            log.info("Webhook payment.success ignoré pour demande {} — statut actuel: {}", req.getId(), req.getStatus());
        }
    }

    private void handlePaymentFailed(CertificateRequest req, String event) {
        if ("AWAITING_PAYMENT".equalsIgnoreCase(req.getStatus())) {
            req.setStatus("REVIEW_APPROVED");
            requestRepository.save(req);
            log.info("Paiement échoué/annulé ({}) pour demande {} — statut remis à REVIEW_APPROVED", event, req.getId());

            User user = req.getUser();
            if (user != null) {
                auditService.log(user, AuditLog.Actions.REQUEST_UPDATED, "CertificateRequest", req.getId(),
                        Map.of("action", event));
                String body = String.format(
                        "Bonjour %s %s,%n%n" +
                        "Votre paiement n'a pas abouti (%s).%n%n" +
                        "Vous pouvez réessayer depuis la plateforme PKI Souverain.%n%n" +
                        "Cordialement,%nAutorité de Certification Souveraine",
                        user.getFirstName(), user.getLastName(), event
                );
                emailService.sendSimpleEmail(user.getEmail(),
                        "Paiement non abouti — PKI Souverain", body);
            }
        }
    }

    /**
     * Vérifie le statut du paiement SharePay et confirme si SUCCESS.
     * Appelé par l'utilisateur depuis l'interface de suivi.
     */
    @Transactional
    @PostMapping("/payment/verify/{requestId}")
    public ResponseEntity<?> verifyPayment(
            Authentication authentication,
            @PathVariable("requestId") UUID requestId
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(401).build();
        }
        Optional<CertificateRequest> opt = requestRepository.findByIdAndUser(requestId, user);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Demande introuvable."));
        }
        CertificateRequest req = opt.get();
        if (!"AWAITING_PAYMENT".equalsIgnoreCase(req.getStatus())) {
            return ResponseEntity.ok(Map.of("status", req.getStatus(), "message", "Statut actuel : " + req.getStatus()));
        }

        String reference = req.getSharePayReference();
        if (reference == null || reference.isBlank()) {
            return ResponseEntity.status(400).body(Map.of("error", "Aucune référence de paiement associée à cette demande."));
        }

        String payStatus = sharePayService.getPayInStatus(reference);
        log.info("Vérification paiement demande {} (ref={}): SharePay status={}", requestId, reference, payStatus);

        return switch (payStatus.toUpperCase()) {
            case "SUCCESS" -> {
                handlePaymentSuccess(req, reference);
                yield ResponseEntity.ok(Map.of("status", "PAYMENT_CONFIRMED", "message", "Paiement confirmé."));
            }
            case "FAILED", "CANCELLED" -> {
                handlePaymentFailed(req, "payment." + payStatus.toLowerCase());
                yield ResponseEntity.ok(Map.of("status", "REVIEW_APPROVED", "message", "Paiement échoué — vous pouvez réessayer."));
            }
            default -> ResponseEntity.ok(Map.of("status", "AWAITING_PAYMENT", "message", "Paiement en attente chez SharePay (statut: " + payStatus + ")."));
        };
    }

    /**
     * Confirmation manuelle du paiement par un administrateur.
     * Accessible via /admin/** donc protégé par le rôle admin dans SecurityConfig.
     */
    @Transactional
    @PostMapping("/admin/payment/confirm/{requestId}")
    public ResponseEntity<?> adminConfirmPayment(
            Authentication authentication,
            @PathVariable("requestId") UUID requestId
    ) {
        Optional<CertificateRequest> opt = requestRepository.findById(requestId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Demande introuvable."));
        }
        CertificateRequest req = opt.get();
        if (!"AWAITING_PAYMENT".equalsIgnoreCase(req.getStatus())) {
            return ResponseEntity.status(400).body(Map.of(
                    "error", "Cette demande n'est pas en attente de paiement (statut : " + req.getStatus() + ")."));
        }

        req.setStatus("PAYMENT_CONFIRMED");
        requestRepository.save(req);

        String adminEmail = authentication != null ? authentication.getName() : "admin";
        log.info("Paiement confirmé manuellement par {} pour demande {}", adminEmail, requestId);

        User user = req.getUser();
        if (user != null) {
            auditService.log(user, AuditLog.Actions.REQUEST_UPDATED, "CertificateRequest", requestId,
                    Map.of("action", "payment_confirmed_manually", "by", adminEmail));
            String body = String.format(
                    "Bonjour %s %s,%n%n" +
                    "Votre paiement a été confirmé manuellement par l'administration.%n%n" +
                    "Vous pouvez maintenant soumettre votre CSR sur la plateforme PKI Souverain.%n%n" +
                    "Cordialement,%nAutorité de Certification Souveraine",
                    user.getFirstName(), user.getLastName()
            );
            emailService.sendSimpleEmail(user.getEmail(), "Paiement confirmé — PKI Souverain", body);
        }

        return ResponseEntity.ok(Map.of("status", "PAYMENT_CONFIRMED", "message", "Paiement confirmé manuellement."));
    }

    /**
     * Liste tous les paiements (demandes ayant initié ou confirmé un paiement).
     * Accessible aux admins — protégé par /admin/** dans SecurityConfig.
     * @Transactional requis : User est LAZY sur CertificateRequest.
     */
    @Transactional(readOnly = true)
    @GetMapping("/admin/payments")
    public ResponseEntity<?> listPayments() {
        try {
            String amount = parametreRepository.findById("payment_amount")
                    .map(p -> p.getValeur())
                    .orElse("5000");

            List<Map<String, Object>> result = requestRepository.findAll().stream()
                    .filter(r -> r.getSharePayReference() != null
                            || "AWAITING_PAYMENT".equalsIgnoreCase(r.getStatus())
                            || "PAYMENT_CONFIRMED".equalsIgnoreCase(r.getStatus()))
                    .sorted(Comparator.comparing(
                            r -> r.getPaymentInitiatedAt() != null ? r.getPaymentInitiatedAt() : r.getCreatedAt(),
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .map(req -> {
                        LinkedHashMap<String, Object> m = new LinkedHashMap<>();
                        m.put("requestId", req.getId().toString());
                        m.put("status", req.getStatus() != null ? req.getStatus() : "");
                        m.put("sharePayReference", req.getSharePayReference() != null ? req.getSharePayReference() : "");
                        m.put("paymentInitiatedAt", req.getPaymentInitiatedAt() != null ? req.getPaymentInitiatedAt().toString() : "");
                        m.put("amount", amount);
                        m.put("commonName", req.getCommonName() != null ? req.getCommonName() : "");
                        User u = req.getUser();
                        if (u != null) {
                            m.put("userId", u.getId().toString());
                            m.put("userName", ((u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "")).trim());
                            m.put("userEmail", u.getEmail() != null ? u.getEmail() : "");
                        } else {
                            m.put("userId", "");
                            m.put("userName", ((req.getFirstName() != null ? req.getFirstName() : "") + " " + (req.getLastName() != null ? req.getLastName() : "")).trim());
                            m.put("userEmail", req.getEmail() != null ? req.getEmail() : "");
                        }
                        return (Map<String, Object>) m;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur chargement liste paiements: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Erreur lors du chargement des paiements."));
        }
    }
}
