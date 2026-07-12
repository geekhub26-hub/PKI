package cm.gov.pki.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Envoi de SMS via l'API Brevo Transactional SMS.
 * Fallback : log uniquement si la clé API est absente (dev/test).
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);
    private static final String BREVO_SMS_URL = "https://api.brevo.com/v3/transactionalSMS/sms";

    @Value("${pki.email.brevo-api-key:}")
    private String brevoApiKey;

    @Value("${pki.sms.sender:ANTIC}")
    private String smsSender;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Envoie un SMS. Ne lève pas d'exception si l'envoi échoue (mode best-effort).
     *
     * @param to      Numéro international, ex. +237612345678
     * @param message Texte du SMS (160 car. max recommandé)
     */
    public void send(String to, String message) {
        if (to == null || to.isBlank()) {
            log.debug("SMS non envoyé : numéro absent");
            return;
        }
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            log.info("[SMS-DEV] → {} : {}", to, message);
            return;
        }
        try {
            String normalised = normalisePhone(to);
            String body = String.format(
                "{\"sender\":\"%s\",\"recipient\":\"%s\",\"content\":\"%s\",\"type\":\"transactional\"}",
                escape(smsSender), escape(normalised), escape(message)
            );
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_SMS_URL))
                    .header("api-key", brevoApiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                log.info("SMS envoyé à {} ({})", normalised, resp.statusCode());
            } else {
                log.warn("Échec SMS à {} : HTTP {} — {}", normalised, resp.statusCode(), resp.body());
            }
        } catch (Exception e) {
            log.warn("Erreur envoi SMS à {} : {}", to, e.getMessage());
        }
    }

    /** Envoie un code OTP par SMS. */
    public void sendOtp(String to, String code, String firstName) {
        String msg = "Bonjour " + (firstName != null ? firstName : "") + ", votre code de verification ANTIC est : " + code + ". Valable 15 minutes.";
        send(to, msg);
    }

    /** Envoie un code 2FA par SMS. */
    public void send2Fa(String to, String code) {
        send(to, "ANTIC - Code de connexion 2FA : " + code + ". Valable 10 minutes. Ne le partagez pas.");
    }

    /** Notifie la génération d'un récépissé par SMS. */
    public void sendRecepisseGenere(String to, String numero, String dateExpiration) {
        send(to, "ANTIC : Votre recepisse " + numero + " est disponible. Valide jusqu'au " + dateExpiration + ". Telechargez-le sur la plateforme.");
    }

    /** Rappel d'expiration de récépissé. */
    public void sendRappelExpiration(String to, String numero, int joursRestants, String dateExpiration) {
        send(to, "ANTIC : Votre recepisse " + numero + " expire dans " + joursRestants + " jour(s) (" + dateExpiration + "). Contactez un administrateur.");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** Normalise un numéro camerounais en format international E.164. */
    private String normalisePhone(String phone) {
        String p = phone.replaceAll("[\\s\\-()]", "");
        if (p.startsWith("00")) p = "+" + p.substring(2);
        if (!p.startsWith("+") && p.startsWith("6") && p.length() == 9) p = "+237" + p;
        if (!p.startsWith("+") && p.startsWith("2376")) p = "+" + p;
        return p;
    }

    private String escape(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
