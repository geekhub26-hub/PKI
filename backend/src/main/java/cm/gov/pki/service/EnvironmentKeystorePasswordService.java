package cm.gov.pki.service;

import cm.gov.pki.entity.CAConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EnvironmentKeystorePasswordService implements KeystorePasswordService {

    @Value("${pki.ca.default-keystore-password:changeit}")
    private String defaultPassword;

    @Value("${pki.ca.keystore-password-env:}")
    private String keystorePasswordEnvVar;

    @Override
    public char[] getPassword(CAConfiguration ca) {
        try {
            if (keystorePasswordEnvVar != null && !keystorePasswordEnvVar.isBlank()) {
                String env = System.getenv(keystorePasswordEnvVar);
                if (env != null && !env.isBlank()) return env.toCharArray();
            }
        } catch (Exception ignored) {}
        return defaultPassword.toCharArray();
    }
}
