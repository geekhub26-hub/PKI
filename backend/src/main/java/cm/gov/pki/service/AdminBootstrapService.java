package cm.gov.pki.service;

import cm.gov.pki.entity.User;
import cm.gov.pki.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminBootstrapService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${pki.bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${pki.bootstrap.admin.password:}")
    private String adminPassword;

    @Value("${pki.bootstrap.admin.first-name:Administrateur}")
    private String adminFirstName;

    @Value("${pki.bootstrap.admin.last-name:Systeme}")
    private String adminLastName;

    @Value("${pki.bootstrap.superadmin.email:}")
    private String superAdminEmail;

    @Value("${pki.bootstrap.superadmin.password:}")
    private String superAdminPassword;

    @Value("${pki.bootstrap.superadmin.first-name:SuperAdmin}")
    private String superAdminFirstName;

    @Value("${pki.bootstrap.superadmin.last-name:ANTIC}")
    private String superAdminLastName;

    public AdminBootstrapService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        bootstrapAdmin();
        bootstrapSuperAdmin();
    }

    private void bootstrapAdmin() {
        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.info("Admin bootstrap skipped: PKI_BOOTSTRAP_ADMIN_EMAIL / PASSWORD not set.");
            return;
        }
        String email = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            log.info("Admin bootstrap skipped: {} already exists", email);
            return;
        }
        if (adminPassword.length() < 8) {
            throw new IllegalStateException("PKI_BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters");
        }
        User admin = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .firstName(blankToDefault(adminFirstName, "Administrateur"))
                .lastName(blankToDefault(adminLastName, "Systeme"))
                .role(User.UserRole.ADMIN)
                .isActive(true)
                .emailVerified(true)
                .build();
        userRepository.save(admin);
        log.info("Bootstrap admin created: {}", email);
    }

    private void bootstrapSuperAdmin() {
        if (superAdminEmail == null || superAdminEmail.isBlank()
                || superAdminPassword == null || superAdminPassword.isBlank()) {
            log.info("SuperAdmin bootstrap skipped: PKI_BOOTSTRAP_SUPERADMIN_EMAIL / PASSWORD not set.");
            return;
        }
        String saEmail = superAdminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(saEmail)) {
            log.info("SuperAdmin bootstrap skipped: {} already exists", saEmail);
            return;
        }
        if (superAdminPassword.length() < 8) {
            throw new IllegalStateException("PKI_BOOTSTRAP_SUPERADMIN_PASSWORD must be at least 8 characters");
        }
        User sa = User.builder()
                .email(saEmail)
                .passwordHash(passwordEncoder.encode(superAdminPassword))
                .firstName(blankToDefault(superAdminFirstName, "SuperAdmin"))
                .lastName(blankToDefault(superAdminLastName, "ANTIC"))
                .role(User.UserRole.SUPER_ADMIN)
                .isActive(true)
                .emailVerified(true)
                .build();
        userRepository.save(sa);
        log.info("Bootstrap super-admin created: {}", saEmail);
    }

    private static String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
