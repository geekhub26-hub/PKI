package cm.gov.pki.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class CAServiceTest {

    @Mock
    private cm.gov.pki.repository.CAConfigurationRepository caConfigurationRepository;
    @Mock
    private cm.gov.pki.repository.CertificateRepository certificateRepository;
    @Mock
    private cm.gov.pki.repository.CertificateRequestRepository certificateRequestRepository;
    @Mock
    private cm.gov.pki.repository.UserRepository userRepository;
    @Mock
    private KeystorePasswordService keystorePasswordService;

    @InjectMocks
    private CAService caService;

    @Test
    void generateCSR_containsHeader() {
        String csr = caService.generateCSR("test.example", "Org", "CM");
        assertNotNull(csr);
        assertTrue(csr.contains("BEGIN CERTIFICATE REQUEST"));
    }
}
