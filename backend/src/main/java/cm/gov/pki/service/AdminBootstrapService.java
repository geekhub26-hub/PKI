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

    public AdminBootstrapService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.info("Admin bootstrap disabled. Set PKI_BOOTSTRAP_ADMIN_EMAIL and PKI_BOOTSTRAP_ADMIN_PASSWORD to create the first admin.");
            return;
        }

        String email = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            log.info("Admin bootstrap skipped: account {} already exists", email);
            return;
        }

        if (adminPassword.length() < 12) {
            throw new IllegalStateException("PKI_BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters");
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
        log.info("Bootstrap admin account created: {}", email);
    }

    private static String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
