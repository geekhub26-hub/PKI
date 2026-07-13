package cm.gov.pki.controller;

import cm.gov.pki.entity.Entite;
import cm.gov.pki.entity.User;
import cm.gov.pki.repository.EntiteRepository;
import cm.gov.pki.repository.UserRepository;
import cm.gov.pki.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/admin")
public class EntiteController {

    private static final Logger log = LoggerFactory.getLogger(EntiteController.class);
    private static final String ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

    private final EntiteRepository entiteRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public EntiteController(EntiteRepository entiteRepository,
                            UserRepository userRepository,
                            EmailService emailService) {
        this.entiteRepository = entiteRepository;
        this.userRepository   = userRepository;
        this.emailService     = emailService;
    }

    // ── CRUD Entités ──────────────────────────────────────────────────────────

    @GetMapping("/entites")
    public ResponseEntity<?> listEntites(Authentication authentication) {
        if (!isSuperAdmin(authentication) && !isAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Entite e : entiteRepository.findAll()) {
            result.add(toMap(e));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/entites")
    public ResponseEntity<?> createEntite(Authentication authentication,
                                          @RequestBody Map<String, String> body) {
        if (!isSuperAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Réservé au SUPER_ADMIN"));
        }
        String code = body.get("code");
        String nom  = body.get("nom");
        String type = body.get("type");
        String parentId = body.get("parentId");

        if (code == null || code.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Code requis"));
        if (nom  == null || nom.isBlank())  return ResponseEntity.badRequest().body(Map.of("error", "Nom requis"));
        if (type == null || type.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Type requis (AE_CENTRALE ou AEL)"));

        if (entiteRepository.findByCode(code.toUpperCase()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "Code déjà utilisé"));
        }

        Entite entite = new Entite();
        entite.setCode(code.toUpperCase().trim());
        entite.setNom(nom.trim());
        try {
            entite.setType(Entite.TypeEntite.valueOf(type.toUpperCase()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Type invalide: " + type));
        }
        if (parentId != null && !parentId.isBlank()) {
            entiteRepository.findById(UUID.fromString(parentId)).ifPresent(entite::setParent);
        }
        entite.setActive(true);
        entite.setCreatedAt(LocalDateTime.now());
        Entite saved = entiteRepository.save(entite);
        return ResponseEntity.ok(toMap(saved));
    }

    @PutMapping("/entites/{id}")
    public ResponseEntity<?> updateEntite(Authentication authentication,
                                          @PathVariable UUID id,
                                          @RequestBody Map<String, String> body) {
        if (!isSuperAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Réservé au SUPER_ADMIN"));
        }
        Optional<Entite> opt = entiteRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Entité introuvable"));
        Entite entite = opt.get();

        if (body.containsKey("nom") && !body.get("nom").isBlank())
            entite.setNom(body.get("nom").trim());
        if (body.containsKey("type") && !body.get("type").isBlank()) {
            try { entite.setType(Entite.TypeEntite.valueOf(body.get("type").toUpperCase())); }
            catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Type invalide"));
            }
        }
        if (body.containsKey("isActive"))
            entite.setActive(Boolean.parseBoolean(body.get("isActive")));

        return ResponseEntity.ok(toMap(entiteRepository.save(entite)));
    }

    @DeleteMapping("/entites/{id}")
    public ResponseEntity<?> deactivateEntite(Authentication authentication, @PathVariable UUID id) {
        if (!isSuperAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Réservé au SUPER_ADMIN"));
        }
        Optional<Entite> opt = entiteRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Entité introuvable"));
        Entite entite = opt.get();
        entite.setActive(false);
        entiteRepository.save(entite);
        return ResponseEntity.ok(Map.of("message", "Entité désactivée"));
    }

    // ── Création admin sous-profil ────────────────────────────────────────────

    @PostMapping("/users/create-admin")
    public ResponseEntity<?> createAdminUser(Authentication authentication,
                                             @RequestBody Map<String, String> body) {
        if (!isSuperAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Réservé au SUPER_ADMIN"));
        }
        String email     = body.get("email");
        String firstName = body.get("firstName");
        String lastName  = body.get("lastName");
        String role      = body.get("role");
        String entiteId  = body.get("entiteId");
        String telephone = body.get("telephone");

        if (email == null || email.isBlank())     return ResponseEntity.badRequest().body(Map.of("error", "Email requis"));
        if (firstName == null || firstName.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Prénom requis"));
        if (lastName == null || lastName.isBlank())   return ResponseEntity.badRequest().body(Map.of("error", "Nom requis"));
        if (role == null || role.isBlank())           return ResponseEntity.badRequest().body(Map.of("error", "Rôle requis"));

        User.UserRole userRole;
        try {
            userRole = User.UserRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rôle invalide: " + role));
        }
        if (userRole == User.UserRole.USER || userRole == User.UserRole.SUPER_ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ce rôle ne peut pas être assigné ici"));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("error", "Email déjà utilisé"));
        }

        // Entité associée obligatoire pour les rôles sous-profil
        Entite entite = null;
        if (entiteId != null && !entiteId.isBlank()) {
            entite = entiteRepository.findById(UUID.fromString(entiteId)).orElse(null);
        }
        if (entite == null && (userRole == User.UserRole.AE_CENTRALE || userRole == User.UserRole.ADMIN_AEL || userRole == User.UserRole.AEL)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Entité requise pour ce rôle"));
        }

        // Mot de passe temporaire aléatoire (12 caractères)
        String tempPassword = generatePassword(12);

        User newAdmin = new User();
        newAdmin.setEmail(email.toLowerCase().trim());
        newAdmin.setFirstName(firstName.trim());
        newAdmin.setLastName(lastName.trim());
        newAdmin.setPasswordHash(passwordEncoder.encode(tempPassword));
        newAdmin.setRole(userRole);
        newAdmin.setEntite(entite);
        newAdmin.setIsActive(true);
        newAdmin.setEmailVerified(true); // compte admin activé directement
        if (telephone != null && !telephone.isBlank()) newAdmin.setTelephone(telephone.trim());
        newAdmin.setCreatedAt(LocalDateTime.now());
        newAdmin.setUpdatedAt(LocalDateTime.now());
        userRepository.save(newAdmin);

        // Envoi email avec le mot de passe temporaire
        try {
            String subject = "PKI Souverain — Vos identifiants administrateur";
            String htmlBody = "<p>Bonjour " + firstName + " " + lastName + ",</p>"
                + "<p>Votre compte administrateur PKI Souverain a été créé avec le rôle <strong>" + userRole.name() + "</strong>.</p>"
                + (entite != null ? "<p>Entité : <strong>" + entite.getNom() + "</strong></p>" : "")
                + "<p>Identifiant : <strong>" + email + "</strong></p>"
                + "<p>Mot de passe temporaire : <strong>" + tempPassword + "</strong></p>"
                + "<p>Veuillez vous connecter et changer votre mot de passe dès que possible.</p>"
                + "<p>— Équipe PKI Souverain / ANTIC</p>";
            emailService.sendSimpleEmail(email, subject, htmlBody);
        } catch (Exception ex) {
            log.warn("Email de bienvenue non envoyé pour {}: {}", email, ex.getMessage());
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", newAdmin.getId().toString());
        resp.put("email", newAdmin.getEmail());
        resp.put("role", userRole.name());
        resp.put("entite", entite != null ? toMap(entite) : null);
        resp.put("message", "Compte créé et mot de passe temporaire envoyé par email");
        return ResponseEntity.ok(resp);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isSuperAdmin(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof User u)) return false;
        return u.getRole() == User.UserRole.SUPER_ADMIN;
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof User u)) return false;
        return u.isSuperAdmin() || u.getRole() == User.UserRole.ADMIN;
    }

    private Map<String, Object> toMap(Entite e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId().toString());
        m.put("code", e.getCode());
        m.put("nom", e.getNom());
        m.put("type", e.getType().name());
        m.put("isActive", e.isActive());
        m.put("parentId", e.getParent() != null ? e.getParent().getId().toString() : null);
        m.put("parentNom", e.getParent() != null ? e.getParent().getNom() : null);
        m.put("createdAt", e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return m;
    }

    private String generatePassword(int length) {
        SecureRandom rng = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) sb.append(ALPHANUM.charAt(rng.nextInt(ALPHANUM.length())));
        return sb.toString();
    }
}
