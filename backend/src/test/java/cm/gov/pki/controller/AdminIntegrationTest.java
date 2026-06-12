package cm.gov.pki.controller;

import cm.gov.pki.entity.Certificate;
import cm.gov.pki.entity.User;
import cm.gov.pki.repository.CertificateRepository;
import cm.gov.pki.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @WithMockUser(roles = "USER")
    void adminEndpointsRejectRegularUsers() throws Exception {
        mvc.perform(get("/admin/stats")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void endToEnd_pkiFlow_revokeAndCrl() throws Exception {
        User admin = userRepository.save(User.builder()
                .email("admin-test@pki.local")
                .passwordHash("test-password-hash")
                .firstName("Admin")
                .lastName("Test")
                .role(User.UserRole.ADMIN)
                .isActive(true)
                .emailVerified(true)
                .build());
        User certUser = userRepository.save(User.builder()
                .email("user-test@pki.local")
                .passwordHash("test-password-hash")
                .firstName("User")
                .lastName("Test")
                .role(User.UserRole.USER)
                .isActive(true)
                .emailVerified(true)
                .build());

        // Generate root CA
        mvc.perform(post("/admin/generate-ca?name=TestRoot")).andExpect(status().isOk());

        // Generate CSR
        String csr = mvc.perform(post("/admin/generate-csr?cn=test.example&o=Org&c=CM"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        // Parse CSR from JSON
        com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
        String csrPem = om.readTree(csr).get("csr").asText();
        assertThat(csrPem).contains("BEGIN CERTIFICATE REQUEST");

        // Sign CSR
        String signResp = mvc.perform(post("/admin/sign-csr")
                        .queryParam("userId", certUser.getId().toString())
                        .contentType(MediaType.TEXT_PLAIN)
                        .content(csrPem))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(signResp).contains("BEGIN CERTIFICATE");

        // Find the issued certificate entity
        Certificate issued = certificateRepository.findAll().stream().findFirst().orElse(null);
        assertThat(issued).isNotNull();

        // Use reflection to read id (avoid relying on Lombok getters in IDE)
        java.lang.reflect.Field idField = Certificate.class.getDeclaredField("id");
        idField.setAccessible(true);
        java.util.UUID certId = (java.util.UUID) idField.get(issued);

        // Revoke the certificate
        mvc.perform(post("/admin/revoke/" + certId)
                        .queryParam("adminId", admin.getId().toString()))
                .andExpect(status().isOk());

        // Reload and check status
        Certificate revoked = certificateRepository.findById(certId).orElseThrow();
        java.lang.reflect.Field statusField = Certificate.class.getDeclaredField("status");
        statusField.setAccessible(true);
        Object statusVal = statusField.get(revoked);
        assertThat(statusVal != null ? statusVal.toString() : null).isEqualTo("REVOKED");

        // Generate CRL and check response contains CRL PEM
        String crlResp = mvc.perform(post("/admin/generate-crl")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(crlResp).contains("BEGIN X509 CRL");
    }
}
