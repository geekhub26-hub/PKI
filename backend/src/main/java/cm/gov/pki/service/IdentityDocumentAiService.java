package cm.gov.pki.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.net.URI;
import java.net.URISyntaxException;

@Service
public class IdentityDocumentAiService {

    private static final Logger log = LoggerFactory.getLogger(IdentityDocumentAiService.class);

    @Value("${pki.identity-ai.provider:heuristic}")
    private String provider;

    @Value("${pki.identity-ai.strict-mode:false}")
    private boolean strictMode;

    @Value("${pki.identity-ai.google.api-key:}")
    private String googleApiKey;

    @Value("${pki.identity-ai.local.url:http://localhost:8000/validate}")
    private String localUrl;

    @Value("${pki.identity-ai.local.api-key:}")
    private String localApiKey;

    @Value("${pki.identity-ai.local.retries:3}")
    private int localRetries;

    @Value("${pki.identity-ai.local.retry-delay-ms:1500}")
    private long localRetryDelayMs;

    @Value("${pki.identity-ai.local.warmup-enabled:true}")
    private boolean localWarmupEnabled;

    // Short timeout for Google Vision / warmup pings
    private final RestTemplate restTemplate    = buildRestTemplate(6_000, 15_000);
    // Long timeout for local AI face comparison (Render cold start can take 60s)
    private final RestTemplate localRestTemplate = buildRestTemplate(10_000, 90_000);
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ValidationResult validateIdentityDocument(MultipartFile file, String expectedType) {
        String expected = expectedType == null ? "" : expectedType.trim().toUpperCase(Locale.ROOT);
        try {
            String providerValue = provider == null ? "heuristic" : provider.trim().toLowerCase(Locale.ROOT);
            if ("local".equals(providerValue)) {
                ValidationResult local = validateWithLocalService(file, expected);
                if (!local.accepted && !strictMode) {
                    return new ValidationResult(true, local.confidence, "Validation IA faible (mode souple): " + local.message);
                }
                return local;
            }

            String text = extractText(file);
            ValidationResult classified = classify(file, text, expected);

            if (!classified.accepted && !strictMode) {
                // Mode souple: ne bloque pas l'utilisateur, mais garde la trace de confiance faible.
                return new ValidationResult(true, classified.confidence, "Validation IA faible (mode souple): " + classified.message);
            }
            return classified;
        } catch (Exception e) {
            log.warn("Identity AI validation failed: {}", e.getMessage());
            if (strictMode) {
                return new ValidationResult(false, 0.0, "Analyse IA impossible en mode strict");
            }
            return new ValidationResult(true, 0.0, "Analyse IA indisponible (mode souple)");
        }
    }

    private ValidationResult validateWithLocalService(MultipartFile file, String expectedType) throws Exception {
        Exception lastException = null;
        int attempts = Math.max(1, localRetries);
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                if (localWarmupEnabled) {
                    warmupLocalService();
                }
                return doLocalValidate(file, expectedType);
            } catch (Exception ex) {
                lastException = ex;
                if (attempt < attempts) {
                    log.warn("Local AI attempt {}/{} failed: {}", attempt, attempts, ex.getMessage());
                    sleepSilently(localRetryDelayMs);
                }
            }
        }
        throw lastException != null ? lastException : new IllegalStateException("Local AI validation failed");
    }

    private ValidationResult doLocalValidate(MultipartFile file, String expectedType) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        if (localApiKey != null && !localApiKey.isBlank()) {
            headers.add("X-API-Key", localApiKey);
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("expectedType", expectedType);
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                String original = file.getOriginalFilename();
                return (original == null || original.isBlank()) ? "document.bin" : original;
            }
        });

        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = localRestTemplate.postForEntity(localUrl, entity, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null || response.getBody().isBlank()) {
            throw new IllegalStateException("Local AI service returned " + response.getStatusCode().value());
        }

        JsonNode root = objectMapper.readTree(response.getBody());
        boolean accepted = root.path("accepted").asBoolean(false);
        double confidence = root.path("confidence").asDouble(0.0);
        String message = root.path("message").asText("Local AI response");
        return new ValidationResult(accepted, confidence, message);
    }

    private void warmupLocalService() {
        String healthUrl = deriveHealthUrl(localUrl);
        if (healthUrl == null) return;
        try {
            restTemplate.getForEntity(healthUrl, String.class);
        } catch (Exception ex) {
            log.debug("Local AI warmup failed: {}", ex.getMessage());
        }
    }

    private static String deriveHealthUrl(String validateUrl) {
        if (validateUrl == null || validateUrl.isBlank()) return null;
        try {
            URI uri = new URI(validateUrl);
            String path = uri.getPath() == null ? "" : uri.getPath();
            String healthPath = path.endsWith("/validate") ? path.substring(0, path.length() - "/validate".length()) + "/health" : "/health";
            URI healthUri = new URI(uri.getScheme(), uri.getAuthority(), healthPath, null, null);
            return healthUri.toString();
        } catch (URISyntaxException ignored) {
            return null;
        }
    }

    private static RestTemplate buildRestTemplate(int connectMs, int readMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectMs);
        factory.setReadTimeout(readMs);
        return new RestTemplate(factory);
    }

    private void sleepSilently(long millis) {
        if (millis <= 0) return;
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    private String extractText(MultipartFile file) {
        String providerValue = provider == null ? "heuristic" : provider.trim().toLowerCase(Locale.ROOT);
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if ("google".equals(providerValue)
                && !googleApiKey.isBlank()
                && contentType.startsWith("image/")) {
            String text = extractTextWithGoogleVision(file);
            if (text != null && !text.isBlank()) return text;
        }

        // Fallback local heuristique: extrait brut de texte (utile .txt/.pdf OCR text layer, noms de fichiers scannés).
        try {
            byte[] bytes = file.getBytes();
            int max = Math.min(bytes.length, 80_000);
            return new String(bytes, 0, max, StandardCharsets.UTF_8).toLowerCase(Locale.ROOT);
        } catch (Exception e) {
            return "";
        }
    }

    private String extractTextWithGoogleVision(MultipartFile file) {
        try {
            String b64 = Base64.getEncoder().encodeToString(file.getBytes());
            Map<String, Object> payload = Map.of(
                    "requests", new Object[]{
                            Map.of(
                                    "image", Map.of("content", b64),
                                    "features", new Object[]{Map.of("type", "TEXT_DETECTION", "maxResults", 1)}
                            )
                    }
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            String url = "https://vision.googleapis.com/v1/images:annotate?key=" + googleApiKey;
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) return "";

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode textNode = root.path("responses").path(0).path("fullTextAnnotation").path("text");
            return textNode.isMissingNode() ? "" : textNode.asText("").toLowerCase(Locale.ROOT);
        } catch (Exception e) {
            log.warn("Google Vision OCR failed: {}", e.getMessage());
            return "";
        }
    }

    private ValidationResult classify(MultipartFile file, String text, String expectedType) {
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        String textLc = text == null ? "" : text.toLowerCase(Locale.ROOT);

        int cniScore = 0;
        int passportScore = 0;

        if (containsAny(fileName, "cni", "identite", "identity", "id_card", "national_id", "carte")) cniScore += 2;
        if (containsAny(textLc, "carte nationale", "carte d'identite", "national identity", "id card", "cni")) cniScore += 3;

        if (containsAny(fileName, "passport", "passeport", "mrz")) passportScore += 2;
        if (containsAny(textLc, "passport", "passeport", "travel document", "p<")) passportScore += 3;

        // Un peu de robustesse MRZ classique pour passeport
        if (textLc.contains("p<") && textLc.length() > 40) passportScore += 2;

        double cniConfidence = Math.min(1.0, cniScore / 6.0);
        double passportConfidence = Math.min(1.0, passportScore / 6.0);

        if ("CNI".equals(expectedType)) {
            if (cniScore >= 3) return new ValidationResult(true, cniConfidence, "CNI detectee");
            return new ValidationResult(false, cniConfidence, "Le document ne ressemble pas a une CNI");
        }

        if ("PASSEPORT".equals(expectedType)) {
            if (passportScore >= 3) return new ValidationResult(true, passportConfidence, "Passeport detecte");
            return new ValidationResult(false, passportConfidence, "Le document ne ressemble pas a un passeport");
        }

        int maxScore = Math.max(cniScore, passportScore);
        if (maxScore >= 3) {
            double conf = Math.max(cniConfidence, passportConfidence);
            String label = cniScore >= passportScore ? "CNI" : "PASSEPORT";
            return new ValidationResult(true, conf, "Document d'identite detecte: " + label);
        }
        return new ValidationResult(false, 0.0, "Document d'identite non detecte");
    }

    private boolean containsAny(String text, String... keys) {
        if (text == null || text.isBlank()) return false;
        for (String k : keys) {
            if (text.contains(k)) return true;
        }
        return false;
    }

    public record ValidationResult(boolean accepted, double confidence, String message) {}

    // ─── Face comparison ──────────────────────────────────────────────────────

    public record FaceComparisonResult(boolean match, double similarity, String message) {}

    /**
     * Compare le visage du selfie avec le visage sur la pièce d'identité.
     * Appelle {localServiceBase}/compare-faces ; en cas d'indisponibilité,
     * retourne un résultat accepté en mode souple (strictMode=false).
     */
    public FaceComparisonResult compareFaces(MultipartFile document, MultipartFile selfie) {
        String compareUrl = deriveCompareUrl(localUrl);
        if (compareUrl == null) {
            log.warn("Face comparison URL could not be derived from {}", localUrl);
            return new FaceComparisonResult(false, 0.0, "Service de comparaison faciale indisponible — réessayez dans quelques secondes");
        }

        // Pre-read bytes once — MultipartFile stream can only be read once
        byte[] docBytes, selfieBytes;
        try {
            docBytes    = document.getBytes();
            selfieBytes = selfie.getBytes();
        } catch (Exception e) {
            log.warn("Could not read face comparison files: {}", e.getMessage());
            return new FaceComparisonResult(false, 0.0, "Erreur lecture fichiers — réessayez");
        }

        int attempts = Math.max(1, localRetries);
        Exception lastErr = null;
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);
                if (localApiKey != null && !localApiKey.isBlank()) {
                    headers.add("X-API-Key", localApiKey);
                }

                final byte[] db = docBytes, sb = selfieBytes;
                final String docName = document.getOriginalFilename();
                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("document", new ByteArrayResource(db) {
                    @Override public String getFilename() { return (docName == null || docName.isBlank()) ? "document.bin" : docName; }
                });
                body.add("selfie", new ByteArrayResource(sb) {
                    @Override public String getFilename() { return "selfie.jpg"; }
                });

                ResponseEntity<String> response = localRestTemplate.postForEntity(
                        compareUrl, new HttpEntity<>(body, headers), String.class);

                if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                    throw new IllegalStateException("compare-faces HTTP " + response.getStatusCode().value());
                }

                JsonNode root = objectMapper.readTree(response.getBody());
                boolean match      = root.path("match").asBoolean(false);
                double  similarity = root.path("similarity").asDouble(0.0);
                String  message    = root.path("message").asText("Résultat comparaison faciale");
                log.info("Face comparison attempt {}/{}: match={} similarity={}", attempt, attempts, match, similarity);
                return new FaceComparisonResult(match, similarity, message);

            } catch (Exception e) {
                lastErr = e;
                log.warn("Face comparison attempt {}/{} failed: {}", attempt, attempts, e.getMessage());
                if (attempt < attempts) sleepSilently(localRetryDelayMs);
            }
        }

        log.warn("Face comparison unavailable after {} attempts: {}", attempts, lastErr != null ? lastErr.getMessage() : "unknown");
        if (strictMode) {
            return new FaceComparisonResult(false, 0.0, "Service de comparaison faciale indisponible — réessayez dans quelques secondes");
        }
        // Mode souple : si le service est down, on ne bloque pas l'usager
        log.warn("Face comparison unavailable — soft mode: accepting request without face check");
        return new FaceComparisonResult(true, 0.0, "Comparaison faciale non disponible (mode souple)");
    }

    private static String deriveCompareUrl(String validateUrl) {
        if (validateUrl == null || validateUrl.isBlank()) return null;
        try {
            URI uri = new URI(validateUrl);
            String path = uri.getPath() == null ? "" : uri.getPath();
            String comparePath = path.endsWith("/validate")
                    ? path.substring(0, path.length() - "/validate".length()) + "/compare-faces"
                    : "/compare-faces";
            return new URI(uri.getScheme(), uri.getAuthority(), comparePath, null, null).toString();
        } catch (URISyntaxException ignored) {
            return null;
        }
    }
}
