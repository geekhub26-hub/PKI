package cm.gov.pki.service;

import cm.gov.pki.entity.CAConfiguration;
import cm.gov.pki.entity.Certificate;
import cm.gov.pki.repository.CAConfigurationRepository;
import cm.gov.pki.repository.CertificateRepository;
import cm.gov.pki.repository.CertificateRequestRepository;
import cm.gov.pki.repository.UserRepository;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.BasicConstraints;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.KeyUsage;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.cert.X509CRLHolder;
import org.bouncycastle.cert.X509v2CRLBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.bouncycastle.openssl.jcajce.JcaPEMWriter;
import org.bouncycastle.pkcs.PKCS10CertificationRequest;
import org.bouncycastle.pkcs.jcajce.JcaPKCS10CertificationRequest;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.Key;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.security.Security;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.lang.reflect.Field;

@Service
public class CAService {

    private static final Logger log = LoggerFactory.getLogger(CAService.class);

    private final CAConfigurationRepository caConfigurationRepository;
    private final CertificateRepository certificateRepository;
    private final CertificateRequestRepository certificateRequestRepository;
    private final UserRepository userRepository;
    private final KeystorePasswordService keystorePasswordService;
    
    @Value("${pki.ca.root-path:ca-store}")
    public String caStore;
    public CAService(CAConfigurationRepository caConfigurationRepository,
                     CertificateRepository certificateRepository,
                     CertificateRequestRepository certificateRequestRepository,
                     UserRepository userRepository,
                     KeystorePasswordService keystorePasswordService) {
        this.caConfigurationRepository = caConfigurationRepository;
        this.certificateRepository = certificateRepository;
        this.certificateRequestRepository = certificateRequestRepository;
        this.userRepository = userRepository;
        this.keystorePasswordService = keystorePasswordService;
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    @Transactional
    public CAConfiguration generateRootCA(String caName, int keySize, int validityDays) {
        try {
            Files.createDirectories(Path.of(caStore));

            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA", BouncyCastleProvider.PROVIDER_NAME);
            kpg.initialize(keySize, new SecureRandom());
            KeyPair kp = kpg.generateKeyPair();

            X500Name subject = new X500Name("CN=" + caName + ", O=PKI Souverain, C=CM");
            BigInteger serial = BigInteger.valueOf(Math.abs(new SecureRandom().nextLong()));

            Date notBefore = Date.from(LocalDateTime.now().minusDays(1).atZone(ZoneId.systemDefault()).toInstant());
            Date notAfter = Date.from(LocalDateTime.now().plusDays(validityDays).atZone(ZoneId.systemDefault()).toInstant());

            JcaX509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    subject,
                    serial,
                    notBefore,
                    notAfter,
                    subject,
                    kp.getPublic()
            );

            certBuilder.addExtension(Extension.basicConstraints, true, new BasicConstraints(true));
            certBuilder.addExtension(Extension.keyUsage, true, new KeyUsage(KeyUsage.keyCertSign | KeyUsage.cRLSign));

            ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA").build(kp.getPrivate());

            X509Certificate cert = new JcaX509CertificateConverter()
                    .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                    .getCertificate(certBuilder.build(signer));

            // Paths
            String baseName = caName.replaceAll("\\s+", "_").toLowerCase();
            Path keyPath = Path.of(caStore, baseName + ".p12");
            Path certPath = Path.of(caStore, baseName + ".crt.pem");

            // Write certificate PEM
            try (JcaPEMWriter pw = new JcaPEMWriter(new FileWriter(certPath.toFile()))) {
                pw.writeObject(cert);
            }

            byte[] ksBytes = writeCaKeystore(keyPath, kp.getPrivate(), cert);

            // Persist CAConfiguration
                CAConfiguration cfg = new CAConfiguration();
                cfg.caName = caName;
                cfg.caCertPath = certPath.toAbsolutePath().toString();
                cfg.caKeyPath = keyPath.toAbsolutePath().toString();
                cfg.keystoreData = ksBytes;
                cfg.validFrom = LocalDateTime.now();
                cfg.validUntil = LocalDateTime.now().plusDays(validityDays);
                cfg.keyAlgorithm = "RSA";
                cfg.keySize = keySize;
                cfg.signatureAlgorithm = "SHA256withRSA";
                cfg.isActive = true;

            CAConfiguration saved = caConfigurationRepository.save(cfg);

            log.info("Generated root CA: {} (cert={}, keystore={})", caName, certPath, keyPath);
            return saved;

        } catch (Exception e) {
            log.error("Failed to generate root CA", e);
            throw new RuntimeException("Échec génération AC: " + e.getMessage(), e);
        }
    }

        /**
     * Sign a CSR (PEM) using the active CA and persist the issued certificate.
     */
    @Transactional
    public String signCSR(String csrPem, int validityDays, java.util.UUID userId) {
        return signCSR(csrPem, validityDays, userId, null);
    }

    /**
     * Sign a CSR (PEM) using the active CA and persist the issued certificate.
     * Optionally links the certificate to a certificate request.
     */
    @Transactional
    public String signCSR(String csrPem, int validityDays, java.util.UUID userId, java.util.UUID requestId) {
        try {
            CAConfiguration ca = caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
                    .orElseThrow(() -> new RuntimeException("Aucune AC active trouvée"));

            if (ca.caCertPath == null || ca.caCertPath.isBlank() || ca.caKeyPath == null || ca.caKeyPath.isBlank()) {
                throw new RuntimeException("AC non configuree: chemins certificat/cle manquants");
            }

            // Load CA private key (from PEM or PKCS12 keystore)
            PrivateKey caPrivateKey = loadPrivateKeyForCA(ca);

            if (caPrivateKey == null) {
                throw new RuntimeException("AC non configuree: cle privee introuvable");
            }

            // Read CA cert
            Path certPath = Path.of(ca.caCertPath);

            if (!Files.exists(certPath)) {
                throw new RuntimeException("AC non configuree: certificat introuvable");
            }
            X509Certificate caCert;
            try (PEMParser p = new PEMParser(Files.newBufferedReader(certPath))) {
                X509CertificateHolder holder = (X509CertificateHolder) p.readObject();
                caCert = new JcaX509CertificateConverter().setProvider(BouncyCastleProvider.PROVIDER_NAME).getCertificate(holder);
            }

            // Parse CSR
            PKCS10CertificationRequest csr;
            try (PEMParser p = new PEMParser(new StringReader(csrPem))) {
                csr = (PKCS10CertificationRequest) p.readObject();
            }

            JcaPKCS10CertificationRequest jcaRequest = new JcaPKCS10CertificationRequest(csr);

            BigInteger serial = BigInteger.valueOf(Math.abs(new SecureRandom().nextLong()));
            Date notBefore = Date.from(Instant.now().minusSeconds(60));
            Date notAfter = Date.from(Instant.now().plusSeconds((long) validityDays * 24 * 3600));

            // Convert issuer and subject to X500Name (BouncyCastle types) to match constructor
            X500Name issuerName = X500Name.getInstance(caCert.getSubjectX500Principal().getEncoded());
            X500Name subjectName = X500Name.getInstance(jcaRequest.getSubject().getEncoded());

            JcaX509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    issuerName,
                    serial,
                    notBefore,
                    notAfter,
                    subjectName,
                    jcaRequest.getPublicKey()
            );

            ContentSigner signer = new JcaContentSignerBuilder(ca.signatureAlgorithm)
                    .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                    .build(caPrivateKey);

            X509CertificateHolder issuedHolder = certBuilder.build(signer);
            X509Certificate issuedCert = new JcaX509CertificateConverter()
                    .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                    .getCertificate(issuedHolder);

            // PEM output
            StringWriter sw = new StringWriter();
            try (JcaPEMWriter pw = new JcaPEMWriter(sw)) {
                pw.writeObject(issuedCert);
            }
            String pem = sw.toString();

            // Compute fingerprint
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] fp = md.digest(issuedCert.getEncoded());
            StringBuilder hex = new StringBuilder();
            for (byte b : fp) hex.append(String.format("%02x", b));

            // Persist Certificate entity if user exists
            if (userId != null) {
                Optional<cm.gov.pki.entity.User> ou = userRepository.findById(userId);
                if (ou.isPresent()) {
                    cm.gov.pki.entity.User user = ou.get();
                    Certificate certEntity = new Certificate();
                    certEntity.setUser(user);
                    certEntity.setSerialNumber(serial.toString());
                    certEntity.setFingerprintSha256(hex.toString());
                    certEntity.setCertificatePem(pem);
                    certEntity.setPublicKeyPem(jcaRequest.getPublicKey().toString());
                    certEntity.setSubjectDN(subjectName.toString());
                    certEntity.setIssuerDN(issuerName.toString());
                    certEntity.setNotBefore(LocalDateTime.ofInstant(notBefore.toInstant(), ZoneId.systemDefault()));
                    certEntity.setNotAfter(LocalDateTime.ofInstant(notAfter.toInstant(), ZoneId.systemDefault()));
                    certEntity.setStatus(Certificate.CertificateStatus.ACTIVE);
                    certEntity.setIssuedAt(LocalDateTime.now());

                    if (requestId != null) {
                        certificateRequestRepository.findById(requestId).ifPresent(req -> {
                            certEntity.setRequest(req);
                            // Only available when CSR was generated server-side.
                            certEntity.setPrivateKeyPem(req.getServerPrivateKeyPem());
                            req.setServerPrivateKeyPem(null);
                            certificateRequestRepository.save(req);
                        });
                    }

                    certificateRepository.save(certEntity);
                }
            }

            return pem;

        } catch (Exception e) {
            log.error("Failed to sign CSR", e);
            throw new RuntimeException("Échec signature CSR: " + e.getMessage(), e);
        }
    }

    /**
     * Create a PKCS12 keystore containing the CA private key and certificate (encrypted by password).
     * Deletes the plaintext PEM private key file after keystore creation for security.
     */
    public Path createKeystore(CAConfiguration ca, String password) {
        try {
            Path keyPath = Path.of(ca.caKeyPath);
            Path certPath = Path.of(ca.caCertPath);

            if (!Files.exists(certPath)) {
                throw new RuntimeException("AC non configuree: certificat introuvable");
            }
            X509Certificate caCert;
            try (PEMParser p = new PEMParser(Files.newBufferedReader(certPath))) {
                X509CertificateHolder holder = (X509CertificateHolder) p.readObject();
                caCert = new JcaX509CertificateConverter().setProvider(BouncyCastleProvider.PROVIDER_NAME).getCertificate(holder);
            }

            if (Files.exists(keyPath) && keyPath.toString().toLowerCase().endsWith(".p12")) {
                return keyPath;
            }

            PrivateKey caPrivateKey = readPrivateKeyFromPem(keyPath);

            java.security.KeyStore ks = java.security.KeyStore.getInstance("PKCS12");
            ks.load(null, null);
            ks.setKeyEntry("ca-key", caPrivateKey, password.toCharArray(), new java.security.cert.Certificate[]{caCert});

            Path ksPath = Path.of(caStore, ca.caName.replaceAll("\\s+", "_").toLowerCase() + ".p12");
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ks.store(baos, password.toCharArray());
            byte[] ksData = baos.toByteArray();
            Files.write(ksPath, ksData);
            ca.caKeyPath = ksPath.toAbsolutePath().toString();
            ca.keystoreData = ksData;
            caConfigurationRepository.save(ca);

            // Secure: delete plaintext PEM private key after keystore creation
            try {
                Files.delete(keyPath);
                log.info("Deleted plaintext PEM private key: {}", keyPath);
            } catch (Exception ex) {
                log.warn("Could not delete PEM private key {}: {}", keyPath, ex.getMessage());
            }

            return ksPath;
        } catch (Exception e) {
            log.error("Failed to create keystore", e);
            throw new RuntimeException(e);
        }
    }

    private byte[] writeCaKeystore(Path keystorePath, PrivateKey privateKey, X509Certificate certificate) throws Exception {
        KeyStore ks = KeyStore.getInstance("PKCS12");
        ks.load(null, null);
        char[] password = keystorePasswordService.getPassword(null);
        ks.setKeyEntry("ca-key", privateKey, password, new java.security.cert.Certificate[]{certificate});
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ks.store(baos, password);
        byte[] data = baos.toByteArray();
        Files.write(keystorePath, data);
        return data;
    }

    private PrivateKey readPrivateKeyFromPem(Path keyPath) throws Exception {
        try (PEMParser p = new PEMParser(Files.newBufferedReader(keyPath))) {
            Object keyObj = p.readObject();
            JcaPEMKeyConverter converter = new JcaPEMKeyConverter().setProvider(BouncyCastleProvider.PROVIDER_NAME);
            if (keyObj instanceof org.bouncycastle.openssl.PEMKeyPair keyPair) {
                return converter.getPrivateKey(keyPair.getPrivateKeyInfo());
            }
            if (keyObj instanceof org.bouncycastle.asn1.pkcs.PrivateKeyInfo privateKeyInfo) {
                return converter.getPrivateKey(privateKeyInfo);
            }
            throw new RuntimeException("Cle privee PEM invalide");
        }
    }

    private PrivateKey loadPrivateKeyFromKeystore(Path ksPath, CAConfiguration ca) throws Exception {
        KeyStore ks = KeyStore.getInstance("PKCS12");
        char[] password = keystorePasswordService.getPassword(ca);
        try (java.io.InputStream is = Files.newInputStream(ksPath)) {
            ks.load(is, password);
        }
        Key key = ks.getKey("ca-key", password);
        if (key instanceof PrivateKey privateKey) {
            return privateKey;
        }
        throw new RuntimeException("Cle privee CA absente du keystore");
    }

    /**
     * GÃ©nÃ©rer un CSR valide pour les tests (retourne PEM)
     */
    public static class GeneratedCsr {
        private final String csrPem;
        private final String privateKeyPem;

        public GeneratedCsr(String csrPem, String privateKeyPem) {
            this.csrPem = csrPem;
            this.privateKeyPem = privateKeyPem;
        }

        public String getCsrPem() { return csrPem; }
        public String getPrivateKeyPem() { return privateKeyPem; }
    }

    public String generateCSR(String commonName, String organization, String country) {
        return generateCSRWithKey(commonName, organization, null, null, null, country, null).getCsrPem();
    }

    public GeneratedCsr generateCSRWithKey(
            String commonName,
            String organization,
            String organizationalUnit,
            String locality,
            String state,
            String country,
            String email
    ) {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA", BouncyCastleProvider.PROVIDER_NAME);
            kpg.initialize(2048, new SecureRandom());
            KeyPair kp = kpg.generateKeyPair();

            StringBuilder dn = new StringBuilder();
            appendDn(dn, "CN", commonName);
            appendDn(dn, "O", organization);
            appendDn(dn, "OU", organizationalUnit);
            appendDn(dn, "L", locality);
            appendDn(dn, "ST", state);
            appendDn(dn, "C", country);
            appendDn(dn, "E", email);

            X500Name subject = new X500Name(dn.toString());
            org.bouncycastle.pkcs.jcajce.JcaPKCS10CertificationRequestBuilder csrBuilder =
                    new org.bouncycastle.pkcs.jcajce.JcaPKCS10CertificationRequestBuilder(subject, kp.getPublic());

            ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                    .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                    .build(kp.getPrivate());

            PKCS10CertificationRequest csr = csrBuilder.build(signer);

            String csrPem;
            try (StringWriter sw = new StringWriter(); JcaPEMWriter pw = new JcaPEMWriter(sw)) {
                pw.writeObject(csr);
                pw.flush();
                csrPem = sw.toString();
            }

            String privateKeyPem;
            try (StringWriter sw = new StringWriter(); JcaPEMWriter pw = new JcaPEMWriter(sw)) {
                pw.writeObject(kp.getPrivate());
                pw.flush();
                privateKeyPem = sw.toString();
            }

            return new GeneratedCsr(csrPem, privateKeyPem);
        } catch (Exception e) {
            log.error("Failed to generate CSR", e);
            throw new RuntimeException("Echec generation CSR: " + e.getMessage(), e);
        }
    }

    public String generateCSR(
            String commonName,
            String organization,
            String organizationalUnit,
            String locality,
            String state,
            String country,
            String email
    ) {
        return generateCSRWithKey(
                commonName,
                organization,
                organizationalUnit,
                locality,
                state,
                country,
                email
        ).getCsrPem();
    }

    private static void appendDn(StringBuilder dn, String key, String value) {
        if (value == null || value.isBlank()) return;
        if (!dn.isEmpty()) dn.append(", ");
        String safe = value.trim().replace("\\", "\\\\").replace(",", "\\,");
        dn.append(key).append("=").append(safe);
    }

    public byte[] buildPkcs12(String certificatePem, String privateKeyPem, String password, String alias) {
        try {
            X509Certificate cert = parseCertificateFromPem(certificatePem);
            PrivateKey privateKey = parsePrivateKeyFromPem(privateKeyPem);

            // Use BC provider: generates PKCS12 with 3DES/SHA1 (legacy RFC 7292 format)
            // compatible with Firefox/NSS, macOS Keychain, OpenSSL — unlike Java 21's
            // default SunJSSE which uses AES-256-CBC (PBES2) rejected by many importers.
            KeyStore ks = KeyStore.getInstance("PKCS12", BouncyCastleProvider.PROVIDER_NAME);
            ks.load(null, null);

            String resolvedAlias = (alias == null || alias.isBlank()) ? "user-cert" : alias;
            char[] pass = password.toCharArray();
            ks.setKeyEntry(resolvedAlias, privateKey, pass, new java.security.cert.Certificate[]{cert});

            try (java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream()) {
                ks.store(baos, pass);
                return baos.toByteArray();
            }
        } catch (Exception e) {
            throw new RuntimeException("Impossible de generer le fichier .p12", e);
        }
    }

    private X509Certificate parseCertificateFromPem(String certificatePem) throws Exception {
        try (PEMParser parser = new PEMParser(new StringReader(certificatePem))) {
            Object obj = parser.readObject();
            if (!(obj instanceof X509CertificateHolder holder)) {
                throw new RuntimeException("Certificat PEM invalide");
            }
            return new JcaX509CertificateConverter()
                    .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                    .getCertificate(holder);
        }
    }

    private PrivateKey parsePrivateKeyFromPem(String privateKeyPem) throws Exception {
        try (PEMParser parser = new PEMParser(new StringReader(privateKeyPem))) {
            Object obj = parser.readObject();
            var converter = new JcaPEMKeyConverter().setProvider(BouncyCastleProvider.PROVIDER_NAME);
            if (obj instanceof org.bouncycastle.openssl.PEMKeyPair keyPair) {
                return converter.getPrivateKey(keyPair.getPrivateKeyInfo());
            }
            if (obj instanceof org.bouncycastle.asn1.pkcs.PrivateKeyInfo privateKeyInfo) {
                return converter.getPrivateKey(privateKeyInfo);
            }
            throw new RuntimeException("Cle privee PEM invalide");
        }
    }

    /**
     * GÃ©nÃ©rer une AC intermÃ©diaire signÃ©e par l'AC racine active
     */
    @Transactional
    public CAConfiguration generateIntermediateCA(String caName, int keySize, int validityDays) {
        try {
            CAConfiguration rootCA = caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
                    .orElseThrow(() -> new RuntimeException("Aucune AC racine active trouvée"));

            // Charger la clÃ© privÃ©e de l'AC racine depuis le keystore ou directement (si PEM existe encore)
            Path rootCertPath = Path.of(rootCA.caCertPath);
            X509Certificate rootCert;
            PrivateKey rootPrivateKey;

            // Try to load root cert
            try (PEMParser p = new PEMParser(Files.newBufferedReader(rootCertPath))) {
                X509CertificateHolder holder = (X509CertificateHolder) p.readObject();
                rootCert = new JcaX509CertificateConverter().setProvider(BouncyCastleProvider.PROVIDER_NAME).getCertificate(holder);
            }

            rootPrivateKey = loadPrivateKeyForCA(rootCA);
            if (rootPrivateKey == null) {
                throw new RuntimeException("AC root private key not available (PEM nor keystore). Cannot generate intermediate CA.");
            }

            // GÃ©nÃ©rer paire de clÃ©s pour l'AC intermÃ©diaire
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA", BouncyCastleProvider.PROVIDER_NAME);
            kpg.initialize(keySize, new SecureRandom());
            KeyPair intermediateKeyPair = kpg.generateKeyPair();

            // CrÃ©er le certificat intermÃ©diaire
            X500Name intermediateSubject = new X500Name("CN=" + caName + ", O=PKI Souverain, C=CM");
            BigInteger serial = BigInteger.valueOf(Math.abs(new SecureRandom().nextLong()));

            Date notBefore = Date.from(LocalDateTime.now().minusDays(1).atZone(ZoneId.systemDefault()).toInstant());
            Date notAfter = Date.from(LocalDateTime.now().plusDays(validityDays).atZone(ZoneId.systemDefault()).toInstant());

            X500Name issuerName = X500Name.getInstance(rootCert.getSubjectX500Principal().getEncoded());

            JcaX509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    issuerName,
                    serial,
                    notBefore,
                    notAfter,
                    intermediateSubject,
                    intermediateKeyPair.getPublic()
            );

            // Ajouter les extensions pour une AC intermÃ©diaire
            certBuilder.addExtension(Extension.basicConstraints, true, new BasicConstraints(true));
            certBuilder.addExtension(Extension.keyUsage, true, new KeyUsage(KeyUsage.keyCertSign | KeyUsage.cRLSign));

            ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                    .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                    .build(rootPrivateKey);

            X509Certificate intermediateCert = new JcaX509CertificateConverter()
                    .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                    .getCertificate(certBuilder.build(signer));

            // Sauvegarder le certificat PEM et protéger la clé dans un keystore PKCS12.
            String baseName = caName.replaceAll("\\s+", "_").toLowerCase();
            Path intermediateCertPath = Path.of(caStore, baseName + ".crt.pem");
            Path intermediateKeyPath = Path.of(caStore, baseName + ".p12");

            try (JcaPEMWriter pw = new JcaPEMWriter(new FileWriter(intermediateCertPath.toFile()))) {
                pw.writeObject(intermediateCert);
            }

            byte[] ksBytes = writeCaKeystore(intermediateKeyPath, intermediateKeyPair.getPrivate(), intermediateCert);

                // Persister la configuration via le builder (évite dépendre des setters Lombok)
                CAConfiguration cfg = new CAConfiguration();
                cfg.caName = caName;
                cfg.caCertPath = intermediateCertPath.toAbsolutePath().toString();
                cfg.caKeyPath = intermediateKeyPath.toAbsolutePath().toString();
                cfg.keystoreData = ksBytes;
                cfg.validFrom = LocalDateTime.now();
                cfg.validUntil = LocalDateTime.now().plusDays(validityDays);
                cfg.keyAlgorithm = "RSA";
                cfg.keySize = keySize;
                cfg.signatureAlgorithm = "SHA256withRSA";
                cfg.isActive = false;

                CAConfiguration saved = caConfigurationRepository.save(cfg);
            log.info("Generated intermediate CA: {} (cert={}, keystore={})", caName, intermediateCertPath, intermediateKeyPath);
            return saved;

        } catch (Exception e) {
            log.error("Failed to generate intermediate CA", e);
            throw new RuntimeException("Échec génération AC intermédiaire: " + e.getMessage(), e);
        }
    }

    // Helper to set private fields when Lombok-generated setters are not available to the compiler/IDE
    private void setField(Object target, String name, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(name);
        f.setAccessible(true);
        f.set(target, value);
    }

    // Helper to read private fields when Lombok-generated getters are not available to the IDE/compiler
    private Object getFieldValue(Object target, String name) throws Exception {
        Field f = target.getClass().getDeclaredField(name);
        f.setAccessible(true);
        return f.get(target);
    }

    @Transactional
    public void revokeCertificateInDb(java.util.UUID certificateId, String reason, cm.gov.pki.entity.User admin) {
        var opt = certificateRepository.findById(certificateId);
        if (opt.isEmpty()) throw new RuntimeException("Certificate not found");
        var cert = opt.get();
        try {
            setField(cert, "status", cm.gov.pki.entity.Certificate.CertificateStatus.REVOKED);
            setField(cert, "revokedAt", java.time.LocalDateTime.now());
            setField(cert, "revokedBy", admin);
            setField(cert, "revocationReason", reason);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        certificateRepository.save(cert);
    }

    // Wrapper appelé par les contrôleurs : révocation DB toujours commitée,
    // mise à jour CRL best-effort (clé CA peut être indisponible sur disque éphémère).
    public void revokeCertificate(java.util.UUID certificateId, String reason, cm.gov.pki.entity.User admin) {
        revokeCertificateInDb(certificateId, reason, admin);

        caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc().ifPresent(ca -> {
            try {
                writeAndPersistCRL(ca);
            } catch (Exception e) {
                log.warn("CRL non mise à jour après révocation (clé CA indisponible) : {}", e.getMessage());
            }
        });
    }

    @Transactional
    public Path writeAndPersistCRL(CAConfiguration ca) {
        try {
            String crlPem = generateCRL(ca);
            Files.createDirectories(Path.of(caStore));
            Path crlPath = Path.of(caStore, ca.caName.replaceAll("\\s+","_").toLowerCase() + ".crl.pem");
            Files.writeString(crlPath, crlPem);
            ca.caCrlPath = crlPath.toAbsolutePath().toString();
            caConfigurationRepository.save(ca);
            return crlPath;
        } catch (Exception e) {
            throw new RuntimeException("Failed to persist CRL: " + e.getMessage(), e);
        }
    }

    // Backwards-compatible alias used in this class
    private Object getField(Object target, String name) throws Exception {
        return getFieldValue(target, name);
    }

    

    // ─── Signing material ─────────────────────────────────────────────────────

    public record CaSigningMaterial(PrivateKey privateKey, X509Certificate[] chain) {}

    public Optional<CaSigningMaterial> getActiveSigningMaterial() {
        Optional<CAConfiguration> caOpt = caConfigurationRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc();
        if (caOpt.isEmpty()) return Optional.empty();
        CAConfiguration ca = caOpt.get();
        try {
            PrivateKey key = loadPrivateKeyForCA(ca);
            if (key == null) return Optional.empty();
            Path certPath = Path.of(ca.caCertPath);
            X509Certificate cert;
            try (PEMParser p = new PEMParser(Files.newBufferedReader(certPath))) {
                X509CertificateHolder holder = (X509CertificateHolder) p.readObject();
                cert = new JcaX509CertificateConverter()
                        .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                        .getCertificate(holder);
            }
            return Optional.of(new CaSigningMaterial(key, new X509Certificate[]{cert}));
        } catch (Exception e) {
            log.warn("Cannot load CA signing material: {}", e.getMessage());
            return Optional.empty();
        }
    }

    // Charge la clé privée : fichier PEM → fichier PKCS12 → bytes en DB (fallback filesystem éphémère).
    private PrivateKey loadPrivateKeyForCA(CAConfiguration ca) {
        try {
            Path keyPath = Path.of(ca.caKeyPath);
            if (Files.exists(keyPath)) {
                String lower = keyPath.toString().toLowerCase();
                if (lower.endsWith(".p12") || lower.endsWith(".pfx")) {
                    return loadPrivateKeyFromKeystore(keyPath, ca);
                }
                return readPrivateKeyFromPem(keyPath);
            }

            // Fallback 1 : chercher le .p12 dans caStore par nom
            String baseName = ca.caName.replaceAll("\\s+", "_").toLowerCase();
            Path ksPath = Path.of(caStore, baseName + ".p12");
            if (Files.exists(ksPath)) {
                return loadPrivateKeyFromKeystore(ksPath, ca);
            }

            // Fallback 2 : charger depuis la base de données (Render / ephemeral disk)
            if (ca.keystoreData != null && ca.keystoreData.length > 0) {
                log.info("Keystore file absent du disque, chargement depuis la DB pour CA: {}", ca.caName);
                PrivateKey key = loadPrivateKeyFromBytes(ca.keystoreData, ca);
                // Recréer le fichier sur disque pour les prochains accès
                try {
                    Files.createDirectories(ksPath.getParent());
                    Files.write(ksPath, ca.keystoreData);
                } catch (Exception ignored) {}
                return key;
            }

        } catch (Exception e) {
            log.warn("Could not load private key for CA {}: {}", ca.caName, e.getMessage());
        }
        return null;
    }

    private PrivateKey loadPrivateKeyFromBytes(byte[] ksBytes, CAConfiguration ca) throws Exception {
        KeyStore ks = KeyStore.getInstance("PKCS12");
        char[] password = keystorePasswordService.getPassword(ca);
        ks.load(new ByteArrayInputStream(ksBytes), password);
        Key key = ks.getKey("ca-key", password);
        if (key instanceof PrivateKey privateKey) {
            return privateKey;
        }
        throw new RuntimeException("Clé privée CA absente du keystore en base de données");
    }

    /**
     * GÃ©nÃ©rer une CRL (Certificate Revocation List) pour l'AC active
     */
    public String generateCRL(CAConfiguration ca) {
        try {
            // Charger l'AC (certificat et clÃ© privÃ©e)
            Path caCertPath = Path.of(ca.caCertPath);

            // Load CA private key (PEM or keystore)
            PrivateKey caPrivateKey = loadPrivateKeyForCA(ca);
            if (caPrivateKey == null) {
                throw new RuntimeException("CA private key not available. Use keystore for CRL generation.");
            }

            X509Certificate caCert;
            try (PEMParser p = new PEMParser(Files.newBufferedReader(caCertPath))) {
                X509CertificateHolder holder = (X509CertificateHolder) p.readObject();
                caCert = new JcaX509CertificateConverter().setProvider(BouncyCastleProvider.PROVIDER_NAME).getCertificate(holder);
            }

            // RÃ©cupÃ©rer les certificats rÃ©voquÃ©s depuis la base de donnÃ©es
            // Pour l'instant, crÃ©er une CRL vide (aucun certificat rÃ©voquÃ©)
            X500Name issuerName = X500Name.getInstance(caCert.getSubjectX500Principal().getEncoded());
            Date thisUpdate = Date.from(Instant.now());
            Date nextUpdate = Date.from(Instant.now().plusSeconds(7 * 24 * 3600)); // 7 jours

            org.bouncycastle.cert.X509v2CRLBuilder crlBuilder = new org.bouncycastle.cert.X509v2CRLBuilder(
                    issuerName,
                    thisUpdate
            );
            crlBuilder.setNextUpdate(nextUpdate);

            // Ajouter les entrÃ©es de rÃ©vocation depuis le repository Certificate
            for (cm.gov.pki.entity.Certificate c : certificateRepository.findAll()) {
                try {
                    Object statusObj = getField(c, "status");
                    Object revokedAtObj = getField(c, "revokedAt");
                    Object serialObj = getField(c, "serialNumber");
                    if (statusObj != null && revokedAtObj != null && serialObj != null) {
                        // Compare by name to avoid depending on enum class identity issues
                        String statusName = statusObj.toString();
                        if ("REVOKED".equals(statusName)) {
                            BigInteger serial = new BigInteger(serialObj.toString());
                            LocalDateTime rdt = (LocalDateTime) revokedAtObj;
                            Date revokedDate = Date.from(rdt.atZone(ZoneId.systemDefault()).toInstant());
                            int reason = 0; // unspecified
                            crlBuilder.addCRLEntry(serial, revokedDate, reason);
                        }
                    }
                } catch (NoSuchFieldException nsf) {
                    log.debug("Certificate field missing when building CRL: {}", nsf.getMessage());
                } catch (Exception ex) {
                    log.warn("Could not add revoked certificate to CRL: {}", ex.getMessage());
                }
            }

            ContentSigner crlSigner = new JcaContentSignerBuilder("SHA256withRSA")
                    .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                    .build(caPrivateKey);

            org.bouncycastle.cert.X509CRLHolder crlHolder = crlBuilder.build(crlSigner);

            StringWriter sw = new StringWriter();
            try (JcaPEMWriter pw = new JcaPEMWriter(sw)) {
                pw.writeObject(crlHolder);
            }

            log.info("Generated CRL for CA: {}", ca.caName);
            return sw.toString();

        } catch (Exception e) {
            log.error("Failed to generate CRL", e);
            throw new RuntimeException("Échec génération CRL: " + e.getMessage(), e);
        }
    }
}


