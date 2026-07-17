package cm.gov.pki.controller;

import cm.gov.pki.entity.Recepisse;
import cm.gov.pki.entity.User;
import cm.gov.pki.repository.UserRepository;
import cm.gov.pki.service.RecepissService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class RecepissController {

    private final RecepissService recepissService;
    private final UserRepository userRepository;

    public RecepissController(RecepissService recepissService, UserRepository userRepository) {
        this.recepissService = recepissService;
        this.userRepository  = userRepository;
    }

    // ─────────────────────────────────────────────
    // Public (sans authentification)
    // ─────────────────────────────────────────────

    @GetMapping("/public/verify/{numero}")
    public ResponseEntity<Map<String, Object>> verify(@PathVariable String numero) {
        Map<String, Object> result = recepissService.verifier(numero);
        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────

    @PostMapping("/admin/recepisses/generer/{requestId}")
    public ResponseEntity<?> generer(@PathVariable UUID requestId, Authentication auth) {
        User agent = resolveUser(auth);
        try {
            Recepisse rec = recepissService.generer(requestId, agent.getId());
            return ResponseEntity.ok(toDto(rec));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur lors de la génération du récépissé."));
        }
    }

    @PostMapping("/admin/recepisses/{id}/regenerer")
    public ResponseEntity<?> regenerer(@PathVariable UUID id, Authentication auth) {
        User agent = resolveUser(auth);
        try {
            Recepisse rec = recepissService.regenerer(id, agent.getId());
            return ResponseEntity.ok(toDto(rec));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/recepisses/{id}/annuler")
    public ResponseEntity<?> annuler(@PathVariable UUID id,
                                     @RequestBody Map<String, String> body,
                                     Authentication auth) {
        User agent = resolveUser(auth);
        String motif = body.getOrDefault("motif", "").trim();
        try {
            Recepisse rec = recepissService.annuler(id, motif, agent.getId());
            return ResponseEntity.ok(toDto(rec));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admin/recepisses/stats")
    public ResponseEntity<Map<String, Object>> stats(
            Authentication auth,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String typeCertif,
            @RequestParam(required = false) java.util.UUID entiteId,
            @RequestParam(required = false) String profilInitiateur) {
        try {
            User user = resolveUser(auth);
            java.util.UUID effectiveEntiteId = entiteId;

            if (user.getRole() == User.UserRole.AEL || user.getRole() == User.UserRole.ADMIN_AEL) {
                effectiveEntiteId = user.getEntite() != null ? user.getEntite().getId() : null;
            }

            return ResponseEntity.ok(recepissService.getStats(
                    effectiveEntiteId, parseDate(dateDebut), parseDate(dateFin),
                    statut, typeCertif, profilInitiateur));
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(RecepissController.class)
                    .error("Erreur chargement stats récépissés: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Impossible de charger les statistiques: " + e.getMessage()));
        }
    }

    private static java.time.LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try { return java.time.LocalDate.parse(s); } catch (Exception e) { return null; }
    }

    @GetMapping("/admin/recepisses/stats/export/pdf")
    public ResponseEntity<byte[]> exportStatsPdf(
            Authentication auth,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String typeCertif,
            @RequestParam(required = false) java.util.UUID entiteId,
            @RequestParam(required = false) String profilInitiateur) {

        User user = resolveUser(auth);
        java.util.UUID effectiveEntiteId = entiteId;
        if (user.getRole() == User.UserRole.AEL || user.getRole() == User.UserRole.ADMIN_AEL) {
            effectiveEntiteId = user.getEntite() != null ? user.getEntite().getId() : null;
        }
        byte[] pdf = recepissService.exportStatsPdf(
                effectiveEntiteId, parseDate(dateDebut), parseDate(dateFin), statut, typeCertif, profilInitiateur);
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"stats-recepisses.pdf\"")
                .body(pdf);
    }

    @GetMapping("/admin/recepisses/export")
    public ResponseEntity<byte[]> exportCsv() {
        byte[] csv = recepissService.exportCsv();
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=\"recepisses.csv\"")
                .body(csv);
    }

    @GetMapping("/admin/recepisses/export/excel")
    public ResponseEntity<byte[]> exportExcel() {
        byte[] xlsx = recepissService.exportExcel();
        return ResponseEntity.ok()
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", "attachment; filename=\"recepisses.xlsx\"")
                .body(xlsx);
    }

    @GetMapping("/admin/recepisses")
    public ResponseEntity<List<Map<String, Object>>> listerTous() {
        List<Map<String, Object>> dtos = recepissService.listerTous().stream()
                .map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/admin/recepisses/{id}/download")
    public ResponseEntity<byte[]> downloadAdmin(@PathVariable UUID id) {
        try {
            byte[] pdf = recepissService.getPdfBytes(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"recepisse-" + id + ".pdf\"")
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin/recepisses/{id}/download/signed")
    public ResponseEntity<byte[]> downloadSignedAdmin(@PathVariable UUID id) {
        try {
            byte[] pdf = recepissService.getSignedPdfBytes(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"recepisse-signe-" + id + ".pdf\"")
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ─────────────────────────────────────────────
    // Usager
    // ─────────────────────────────────────────────

    @GetMapping("/user/recepisses")
    public ResponseEntity<List<Map<String, Object>>> listerMes(Authentication auth) {
        User user = resolveUser(auth);
        List<Map<String, Object>> dtos = recepissService.listerPourUsager(user.getId()).stream()
                .map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/user/recepisses/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable UUID id, Authentication auth) {
        try {
            byte[] pdf = recepissService.getPdfBytes(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"recepisse.pdf\"")
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/recepisses/{id}/download/signed")
    public ResponseEntity<byte[]> downloadSigned(@PathVariable UUID id, Authentication auth) {
        try {
            byte[] pdf = recepissService.getSignedPdfBytes(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"recepisse-signe.pdf\"")
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    private User resolveUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return user;
        }
        throw new IllegalStateException("Utilisateur non authentifié");
    }

    private Map<String, Object> toDto(Recepisse r) {
        return Map.of(
            "id",               r.getId().toString(),
            "numero",           r.getNumero(),
            "nomComplet",       r.getNomComplet() != null ? r.getNomComplet() : "",
            "typeCertificat",   r.getTypeCertificat() != null ? r.getTypeCertificat() : "",
            "dateGeneration",   r.getDateGeneration().toString(),
            "dateExpiration",   r.getDateExpiration().toString(),
            "statut",           r.getStatut(),
            "hashSha256",       r.getHashSha256() != null ? r.getHashSha256() : "",
            "requestId",        r.getCertificateRequest() != null ? r.getCertificateRequest().getId().toString() : "",
            "motifAnnulation",  r.getMotifAnnulation() != null ? r.getMotifAnnulation() : ""
        );
    }
}
