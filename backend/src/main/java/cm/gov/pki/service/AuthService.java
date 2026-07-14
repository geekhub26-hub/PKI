package cm.gov.pki.service;

import cm.gov.pki.dto.AuthDTO;
import cm.gov.pki.entity.User;
import cm.gov.pki.repository.ParametreRepository;
import cm.gov.pki.repository.UserRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * Service d'authentification et gestion JWT
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AuditService auditService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final ParametreRepository parametreRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    // Durée de blocage après dépassement du quota d'échecs (minutes)
    private static final int LOCKOUT_DURATION_MINUTES = 30;

    @Autowired
    public AuthService(UserRepository userRepository, AuditService auditService,
                       EmailService emailService, SmsService smsService,
                       ParametreRepository parametreRepository) {
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.emailService = emailService;
        this.smsService = smsService;
        this.parametreRepository = parametreRepository;
    }

    // Durée d'inactivité avant expiration de session (en minutes, configurable)
    @Value("${pki.session.timeout-minutes:30}")
    private int sessionTimeoutMinutes;

    @Value("${pki.jwt.secret}")
    private String jwtSecret;

    @Value("${pki.jwt.expiration}")
    private Long jwtExpiration;

    @Value("${pki.jwt.refresh-expiration}")
    private Long refreshExpiration;

    /**
     * Inscription d'un nouvel utilisateur
     */
    @Transactional
    public AuthDTO.OtpRequiredResponse register(AuthDTO.RegisterRequest request) {
        log.info("📝 Inscription utilisateur : {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        String otp = generateOtp();

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(User.UserRole.USER)
                .isActive(true)
                .emailVerified(false)
                .build();
        user.setOtpCode(otp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(15));
        if (request.getTelephone() != null && !request.getTelephone().isBlank()) {
            user.setTelephone(request.getTelephone().trim());
        }

        user = userRepository.save(user);

        emailService.sendSimpleEmail(
            user.getEmail(),
            "Code de vérification ANTIC PKI",
            "Bonjour " + user.getFirstName() + ",\n\n"
            + "Votre code de vérification est : " + otp + "\n\n"
            + "Ce code expire dans 15 minutes.\n\nCordialement,\nL'équipe ANTIC"
        );
        // Envoi SMS en parallèle (best-effort)
        if (user.getTelephone() != null) {
            smsService.sendOtp(user.getTelephone(), otp, user.getFirstName());
        }

        auditService.log(user, "USER_REGISTER", "User", user.getId(), null);
        log.info("✅ Utilisateur créé, OTP envoyé : {}", user.getEmail());

        return new AuthDTO.OtpRequiredResponse(user.getEmail());
    }

    @Transactional
    public AuthDTO.UserDTO verifyOtp(String email, String code) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        if (user.getOtpCode() == null || !user.getOtpCode().equals(code)) {
            throw new RuntimeException("Code OTP invalide");
        }
        if (user.getOtpExpiresAt() == null || LocalDateTime.now().isAfter(user.getOtpExpiresAt())) {
            throw new RuntimeException("Code OTP expiré");
        }
        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);
        log.info("✅ Email vérifié par OTP : {}", email);
        return mapToDTO(user);
    }

    @Transactional
    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new RuntimeException("Email déjà vérifié");
        }
        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);
        emailService.sendSimpleEmail(
            user.getEmail(),
            "Nouveau code de vérification ANTIC PKI",
            "Bonjour " + user.getFirstName() + ",\n\nVotre nouveau code : " + otp + "\n\nExpire dans 15 min.\n\nANTIC"
        );
        if (user.getTelephone() != null) {
            smsService.sendOtp(user.getTelephone(), otp, user.getFirstName());
        }
    }

    /**
     * Connexion utilisateur
     */
    @Transactional
    public Object login(AuthDTO.LoginRequest request) {
        log.info("🔑 Tentative de connexion : {}");

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email ou mot de passe invalide"));

        // Vérification du blocage de compte
        if (user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isAfter(LocalDateTime.now())) {
            long minutesLeft = java.time.Duration.between(LocalDateTime.now(), user.getAccountLockedUntil()).toMinutes() + 1;
            throw new RuntimeException("Compte temporairement bloqué. Réessayez dans " + minutesLeft + " minute(s).");
        }

        boolean passwordMatches;
        try {
            passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        } catch (IllegalArgumentException ex) {
            passwordMatches = false;
        }

        if (!passwordMatches) {
            int maxAttempts = readIntParam("max_login_attempts", 5);
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= maxAttempts) {
                user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(LOCKOUT_DURATION_MINUTES));
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
                throw new RuntimeException("Trop de tentatives échouées. Compte bloqué pour " + LOCKOUT_DURATION_MINUTES + " minutes.");
            }
            userRepository.save(user);
            throw new RuntimeException("Email ou mot de passe invalide");
        }

        // Réinitialisation du compteur d'échecs sur succès
        if (user.getFailedLoginAttempts() > 0 || user.getAccountLockedUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setAccountLockedUntil(null);
            userRepository.save(user);
        }

        if (!user.canLogin()) {
            throw new RuntimeException("Compte inactif ou email non vérifié");
        }

        if (user.getRole() == null) {
            user.setRole(User.UserRole.USER);
        }

        LocalDateTime loginAt = LocalDateTime.now();
        updateLastLoginWithRetry(user.getId(), loginAt);
        user.setLastLogin(loginAt);
        touchActivity(user.getId());  // réinitialise le timer d'inactivité dès le login

        // 2FA pour les rôles admin
        if (user.isAdmin()) {
            String code = generateOtp();
            user.setTwoFaCode(code);
            int twoFaMinutes = readIntParam("two_fa_expiry_minutes", 30);
            user.setTwoFaExpiresAt(LocalDateTime.now().plusMinutes(twoFaMinutes));
            userRepository.save(user);
            boolean emailSent = emailService.sendSimpleEmail(
                user.getEmail(),
                "Code de connexion ANTIC PKI (2FA)",
                "Bonjour " + user.getFirstName() + ",\n\n"
                + "Votre code de connexion à 6 chiffres : " + code + "\n\n"
                + "Ce code expire dans 10 minutes.\n\n"
                + "Si vous n'avez pas tenté de vous connecter, ignorez ce message.\n\nANTIC"
            );
            // Envoi SMS 2FA (best-effort, ne bloque pas si l'email a réussi)
            if (user.getTelephone() != null) {
                smsService.send2Fa(user.getTelephone(), code);
            }
            if (!emailSent && user.getTelephone() == null) {
                throw new RuntimeException("Impossible d'envoyer le code 2FA. Vérifiez la configuration SMTP du serveur.");
            }
            String pendingToken = generatePendingToken(user);
            log.info("2FA envoyé à l'admin : {}", user.getEmail());
            return new AuthDTO.TwoFaRequiredResponse(pendingToken);
        }

        auditService.log(user, "USER_LOGIN", "User", user.getId(), null);

        String accessToken = generateAccessToken(user);
        String refreshToken = generateRefreshToken(user);

        log.info("✅ Connexion réussie : {}", user.getEmail());

        AuthDTO.JwtResponse jwt = new AuthDTO.JwtResponse();
        jwt.setAccessToken(accessToken);
        jwt.setRefreshToken(refreshToken);
        jwt.setTokenType("Bearer");
        jwt.setExpiresIn(jwtExpiration);
        jwt.setUser(mapToDTO(user));
        return jwt;
    }

    @Transactional
    public AuthDTO.JwtResponse verify2Fa(String pendingToken, String code) {
        Claims claims;
        try {
            claims = validateToken(pendingToken);
        } catch (Exception e) {
            throw new RuntimeException("Session 2FA invalide ou expirée");
        }
        if (!"2FA_PENDING".equals(claims.get("type"))) {
            throw new RuntimeException("Token invalide");
        }
        UUID userId = UUID.fromString(claims.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        if (user.getTwoFaCode() == null || !user.getTwoFaCode().equals(code)) {
            throw new RuntimeException("Code 2FA invalide");
        }
        if (user.getTwoFaExpiresAt() == null || LocalDateTime.now().isAfter(user.getTwoFaExpiresAt())) {
            throw new RuntimeException("Code 2FA expiré");
        }
        user.setTwoFaCode(null);
        user.setTwoFaExpiresAt(null);
        LocalDateTime now = LocalDateTime.now();
        user.setLastLogin(now);
        user.setLastActivityAt(now);   // réinitialise le timer d'inactivité au login
        userRepository.save(user);
        auditService.log(user, "USER_LOGIN", "User", user.getId(), Map.of("method", "2FA"));
        AuthDTO.JwtResponse jwt = new AuthDTO.JwtResponse();
        jwt.setAccessToken(generateAccessToken(user));
        jwt.setRefreshToken(generateRefreshToken(user));
        jwt.setTokenType("Bearer");
        jwt.setExpiresIn(jwtExpiration);
        jwt.setUser(mapToDTO(user));
        return jwt;
    }

    /**
     * Invalide le refresh token côté serveur (efface refreshTokenHash).
     * Accepte un token expiré — la signature suffit à identifier l'utilisateur.
     */
    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        UUID userId;
        try {
            userId = UUID.fromString(
                Jwts.parser().verifyWith(getSigningKey()).build()
                    .parseSignedClaims(rawRefreshToken).getPayload().getSubject());
        } catch (ExpiredJwtException e) {
            userId = UUID.fromString(e.getClaims().getSubject());
        } catch (Exception e) {
            return;
        }
        userRepository.findById(userId).ifPresent(user -> {
            user.setRefreshTokenHash(null);
            userRepository.save(user);
            log.info("Refresh token invalidé pour {}", user.getEmail());
        });
    }

    /**
     * Génère un Access Token JWT
     */
    private String generateAccessToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        User.UserRole userRole = user.getRole() == null ? User.UserRole.USER : user.getRole();

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", userRole.name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Génère un Refresh Token JWT et persiste son hash SHA-256 pour invalidation ciblée.
     */
    private String generateRefreshToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpiration);

        String token = Jwts.builder()
                .subject(user.getId().toString())
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();

        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = sha256.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) sb.append(String.format("%02x", b));
            user.setRefreshTokenHash(sb.toString());
            userRepository.save(user);
        } catch (Exception e) {
            log.warn("Impossible de stocker le refresh token hash: {}", e.getMessage());
        }

        return token;
    }

    /**
     * Valide un refresh token (signature + hash DB), émet de nouveaux tokens (rotation).
     */
    @Transactional
    public AuthDTO.JwtResponse refreshAccessToken(String rawToken) {
        Claims claims;
        try {
            claims = validateToken(rawToken);
        } catch (RuntimeException e) {
            throw new RuntimeException("Refresh token invalide ou expiré");
        }
        if (!"refresh".equalsIgnoreCase(String.valueOf(claims.get("type")))) {
            throw new RuntimeException("Token invalide");
        }
        UUID userId = UUID.fromString(claims.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Vérification du hash pour détecter les tokens révoqués
        if (user.getRefreshTokenHash() != null) {
            try {
                MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
                byte[] hashBytes = sha256.digest(rawToken.getBytes(StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                for (byte b : hashBytes) sb.append(String.format("%02x", b));
                if (!sb.toString().equals(user.getRefreshTokenHash())) {
                    throw new RuntimeException("Refresh token révoqué");
                }
            } catch (java.security.NoSuchAlgorithmException e) {
                log.warn("SHA-256 indisponible", e);
            }
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new RuntimeException("Compte inactif");
        }

        // Rotation : nouveau pair access + refresh (l'ancien hash est écrasé)
        String newAccessToken = generateAccessToken(user);
        String newRefreshToken = generateRefreshToken(user);

        AuthDTO.JwtResponse response = new AuthDTO.JwtResponse();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(jwtExpiration);
        response.setUser(mapToDTO(user));
        return response;
    }

    /**
     * Valide et parse un token JWT
     */
    public Claims validateToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new RuntimeException("Token expiré");
        } catch (JwtException e) {
            throw new RuntimeException("Token invalide");
        }
    }

    /**
     * Récupère l'utilisateur depuis un token
     */
    public User getUserFromToken(String token) {
        Claims claims = validateToken(token);
        Object type = claims.get("type");
        if (type != null && "refresh".equalsIgnoreCase(type.toString())) {
            throw new RuntimeException("Refresh token non autorisé pour l'accès");
        }
        UUID userId = UUID.fromString(claims.getSubject());
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    /**
     * Clé de signature JWT
     */
    private void updateLastLoginWithRetry(UUID userId, LocalDateTime loginAt) {
        final int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                userRepository.touchLastLogin(userId, loginAt);
                return;
            } catch (org.springframework.dao.CannotAcquireLockException
                     | org.springframework.dao.DeadlockLoserDataAccessException ex) {
                if (attempt == maxAttempts) {
                    log.warn("lastLogin update skipped after deadlock for user {}", userId);
                    return;
                }
                try {
                    Thread.sleep(120L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return;
                }
            } catch (org.springframework.dao.DataAccessException ex) {
                Throwable root = ex.getMostSpecificCause();
                String sqlState = null;
                if (root instanceof java.sql.SQLException sqlEx) {
                    sqlState = sqlEx.getSQLState();
                }
                if (!"40P01".equals(sqlState)) {
                    throw ex;
                }
                if (attempt == maxAttempts) {
                    log.warn("lastLogin update skipped after SQL deadlock for user {}", userId);
                    return;
                }
                try {
                    Thread.sleep(120L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Demande de réinitialisation de mot de passe
     */
    @Transactional
    public void requestPasswordReset(String email) {
        log.info("Demande de réinitialisation du mot de passe pour: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        user.setPasswordResetToken(resetToken);
        user.setPasswordResetTokenExpiresAt(expiresAt);
        userRepository.save(user);

        emailService.sendPasswordResetEmail(email, user.getFirstName(), resetToken);
        log.info("Email de réinitialisation envoyé à: {}", email);
    }

    /**
     * Réinitialise le mot de passe avec un token
     */
    @Transactional
    public void resetPassword(String resetToken, String newPassword) {
        log.info("Tentative de réinitialisation du mot de passe avec token");

        User user = userRepository.findByPasswordResetToken(resetToken)
                .orElseThrow(() -> new RuntimeException("Token invalide ou expiré"));

        // Vérifier l'expiration du token
        if (user.getPasswordResetTokenExpiresAt() == null || 
            LocalDateTime.now().isAfter(user.getPasswordResetTokenExpiresAt())) {
            throw new RuntimeException("Token expiré");
        }

        // Mettre à jour le mot de passe
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Envoyer un email de confirmation
        emailService.sendPasswordResetConfirmationEmail(user.getEmail(), user.getFirstName());

        log.info("Mot de passe réinitialisé avec succès pour: {}", user.getEmail());
    }

    /**
     * Lit un paramètre entier depuis la table parametres, avec fallback sur defaultValue.
     */
    private int readIntParam(String cle, int defaultValue) {
        try {
            return parametreRepository.findById(cle)
                    .map(p -> Integer.parseInt(p.getValeur().trim()))
                    .orElse(defaultValue);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    /**
     * Vérifie si la session est encore active (inactivité < session_timeout_minutes).
     * La valeur est lue depuis la table parametres (clé session_timeout_minutes),
     * avec fallback sur la propriété pki.session.timeout-minutes.
     */
    public boolean isSessionActive(User user) {
        LocalDateTime lastActivity = user.getLastActivityAt();
        if (lastActivity == null) return true;
        int timeout = readIntParam("session_timeout_minutes", sessionTimeoutMinutes);
        return lastActivity.isAfter(LocalDateTime.now().minusMinutes(timeout));
    }

    /** Met à jour lastActivityAt (best-effort, ne lève pas d'exception). */
    @Transactional
    public void touchActivity(UUID userId) {
        try {
            userRepository.touchLastActivity(userId, LocalDateTime.now());
        } catch (Exception e) {
            log.debug("touchActivity échoué pour {} : {}", userId, e.getMessage());
        }
    }

    private String generateOtp() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }

    private String generatePendingToken(User user) {
        int twoFaMinutes = readIntParam("two_fa_expiry_minutes", 30);
        Date now = new Date();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("type", "2FA_PENDING")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + (long) twoFaMinutes * 60 * 1000L))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Convertit User en DTO
     */
    private AuthDTO.UserDTO mapToDTO(User user) {
        AuthDTO.UserDTO dto = new AuthDTO.UserDTO();
        User.UserRole userRole = user.getRole() == null ? User.UserRole.USER : user.getRole();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(userRole.name());
        dto.setIsActive(user.getIsActive());
        dto.setEmailVerified(user.getEmailVerified());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastLogin(user.getLastLogin());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }
}
