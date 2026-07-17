package cm.gov.pki.service;

import cm.gov.pki.repository.ParametreRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class SharePayService {

    private static final Logger log = LoggerFactory.getLogger(SharePayService.class);
    private static final String BASE_URL = "https://sharepay-api.te-sea.com";

    @Value("${pki.payment.sharepay.api-key:}")
    private String apiKey;

    @Value("${pki.payment.sharepay.webhook-secret:}")
    private String webhookSecret;

    @Value("${pki.payment.currency:XAF}")
    private String defaultCurrency;

    private final ParametreRepository parametreRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SharePayService(ParametreRepository parametreRepository) {
        this.parametreRepository = parametreRepository;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);
        this.restTemplate = new RestTemplate(factory);
    }

    private BigDecimal resolveAmount() {
        return parametreRepository.findById("payment_amount")
                .map(p -> {
                    try { return new BigDecimal(p.getValeur().trim()); }
                    catch (NumberFormatException e) { return new BigDecimal("5000"); }
                })
                .orElse(new BigDecimal("5000"));
    }

    /**
     * Crée une session de paiement (checkout) SharePay.
     *
     * @param merchantReference identifiant interne de la demande (requestId)
     * @param successUrl URL de redirection après paiement réussi
     * @param cancelUrl  URL de redirection après annulation
     * @return CheckoutResult contenant reference et paymentUrl
     */
    public CheckoutResult createCheckout(String merchantReference, String successUrl, String cancelUrl) {
        HttpHeaders headers = buildHeaders();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", resolveAmount());
        body.put("currency", defaultCurrency);
        body.put("merchantReference", merchantReference);
        body.put("description", "Certificat numérique PKI Souverain — " + merchantReference);
        body.put("successUrl", successUrl);
        body.put("cancelUrl", cancelUrl);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    BASE_URL + "/api/v1/pay-in/checkout", entity, String.class);

            JsonNode data = parseData(response.getBody());
            return new CheckoutResult(
                    data.path("reference").asText(),
                    data.path("status").asText(),
                    data.path("paymentUrl").asText()
            );
        } catch (HttpClientErrorException ex) {
            log.error("SharePay checkout error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new RuntimeException("Erreur SharePay lors de la création du paiement: " + ex.getStatusCode());
        }
    }

    /**
     * Vérifie la signature HMAC-SHA256 d'un webhook SharePay.
     *
     * @param rawBody         corps brut de la requête
     * @param signatureHeader valeur de X-Sharepay-Signature
     * @return true si la signature est valide
     */
    public boolean verifyWebhookSignature(String rawBody, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("SHAREPAY_WEBHOOK_SECRET non configuré — signature non vérifiée");
            return true;
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computed = HexFormat.of().formatHex(digest);
            return computed.equalsIgnoreCase(signatureHeader.trim());
        } catch (Exception e) {
            log.warn("Erreur lors de la vérification de signature webhook: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Vérifie le statut d'un Pay-In SharePay.
     *
     * @param reference référence PI-...
     * @return statut : PENDING | PROCESSING | SUCCESS | FAILED | CANCELLED | REFUNDED
     */
    public String getPayInStatus(String reference) {
        HttpHeaders headers = buildHeaders();
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    BASE_URL + "/api/v1/pay-in/check_status/" + reference,
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    String.class
            );
            JsonNode data = parseData(response.getBody());
            return data.path("status").asText("UNKNOWN");
        } catch (HttpClientErrorException ex) {
            log.warn("SharePay status check error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            return "UNKNOWN";
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-KEY", apiKey);
        return headers;
    }

    private JsonNode parseData(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode data = root.path("data");
            return data.isMissingNode() ? root : data;
        } catch (Exception e) {
            log.warn("Impossible de parser la réponse SharePay: {}", e.getMessage());
            return objectMapper.createObjectNode();
        }
    }

    public record CheckoutResult(String reference, String status, String paymentUrl) {}
}
