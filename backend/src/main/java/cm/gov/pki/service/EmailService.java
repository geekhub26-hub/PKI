package cm.gov.pki.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

/**
 * Service pour l'envoi d'emails de validation de tokens
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:support@pki-souverain.gov.cm}")
    private String fromEmail;

    @Value("${pki.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${pki.email.debug-mode:false}")
    private boolean debugMode;

    @Value("${pki.email.brevo-api-key:}")
    private String brevoApiKey;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private String buildFrontendHashLink(String routeWithQuery) {
        String base = frontendUrl == null ? "" : frontendUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String route = routeWithQuery.startsWith("/") ? routeWithQuery : "/" + routeWithQuery;
        return base + "/#" + route;
    }

    /**
     * Envoie ou affiche un email en mode debug
     */
    private boolean sendOrLog(SimpleMailMessage message) {
        if (debugMode) {
            log.info("\n=== MODE DEBUG - EMAIL ===\nDe: {}\nA: {}\nSujet: {}\n---\n{}\n=========================",
                message.getFrom(),
                message.getTo() != null ? String.join(", ", message.getTo()) : "",
                message.getSubject(),
                message.getText());
            return true;
        }

        // 1. Brevo HTTP API — contourne les blocages SMTP (port 587 bloqué sur Render)
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            String to = message.getTo() != null && message.getTo().length > 0 ? message.getTo()[0] : "";
            return sendViaBrevo(to, message.getSubject(), message.getText());
        }

        // 2. Fallback SMTP classique
        try {
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            log.error("Erreur SMTP ({}). Configurez BREVO_API_KEY pour contourner les blocages SMTP.", e.getMessage());
            return false;
        }
    }

    private boolean sendViaBrevo(String to, String subject, String text) {
        try {
            String json = "{"
                + "\"sender\":{\"name\":\"PKI Souverain\",\"email\":\"" + escapeJson(fromEmail) + "\"},"
                + "\"to\":[{\"email\":\"" + escapeJson(to) + "\"}],"
                + "\"subject\":\"" + escapeJson(subject) + "\"," 
                + "\"textContent\":\"" + escapeJson(text) + "\""
                + "}";

            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("accept", "application/json")
                    .header("api-key", brevoApiKey)
                    .header("content-type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(json))
                    .build();

            java.net.http.HttpResponse<String> response = client.send(request,
                    java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email envoyé via Brevo à {}", to);
                return true;
            }
            log.error("Brevo API erreur {} : {}", response.statusCode(), response.body());
            return false;
        } catch (Exception e) {
            log.error("Erreur Brevo : {}", e.getMessage());
            return false;
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * Envoie un email avec le token de validation Ã  un utilisateur
     *
     * @param toEmail        Email du destinataire
     * @param userName       Nom de l'utilisateur
     * @param requestId      ID de la demande
     * @param validationToken Token de validation
     */
    public void sendValidationTokenEmail(String toEmail, String userName, UUID requestId, String validationToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Votre certificat numÃ©rique - Jeton de validation");
            
            String validationLink = buildFrontendHashLink(
                String.format("/validate-token?requestId=%s&token=%s", requestId, validationToken)
            );
            
            String messageBody = String.format(
                "Bonjour %s,\n\n" +
                "Votre demande de certificat numÃ©rique a Ã©tÃ© approuvÃ©e.\n\n" +
                "Pour finaliser et tÃ©lÃ©charger votre certificat, veuillez utiliser le lien ci-dessous :\n\n" +
                "%s\n\n" +
                "Ce lien expire dans 24 heures.\n\n" +
                "Si vous n'avez pas demandÃ© de certificat, merci de contacter notre support.\n\n" +
                "Cordialement,\n" +
                "AutoritÃ© de Certification Souveraine",
                userName,
                validationLink
            );
            
            message.setText(messageBody);
            
            boolean sent = sendOrLog(message);
            if (!debugMode && sent) {
                log.info("Email de validation envoyÃ© avec succÃ¨s Ã : {}", toEmail);
            }
            
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de validation Ã  {}: {}", toEmail, e.getMessage(), e);
            // Ne pas lever l'exception pour ne pas bloquer le workflow
            // L'admin peut renvoyer l'email manuellement si besoin
        }
    }

    /**
     * Envoie un email de rejet de demande
     *
     * @param toEmail       Email du destinataire
     * @param userName      Nom de l'utilisateur
     * @param rejectionReason Raison du rejet
     */
    public void sendRejectionEmail(String toEmail, String userName, String rejectionReason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Demande de certificat numÃ©rique - Rejet");
            
            String messageBody = String.format(
                "Bonjour %s,\n\n" +
                "Malheureusement, votre demande de certificat numÃ©rique a Ã©tÃ© rejetÃ©e.\n\n" +
                "Raison : %s\n\n" +
                "Vous pouvez soumettre une nouvelle demande aprÃ¨s avoir rÃ©solu les problÃ¨mes identifiÃ©s.\n\n" +
                "Pour toute question, veuillez contacter notre support.\n\n" +
                "Cordialement,\n" +
                "AutoritÃ© de Certification Souveraine",
                userName,
                rejectionReason != null && !rejectionReason.isBlank() ? rejectionReason : "Non spÃ©cifiÃ©e"
            );
            
            message.setText(messageBody);
            
            boolean sent = sendOrLog(message);
            if (!debugMode && sent) {
                log.info("Email de rejet envoyÃ© avec succÃ¨s Ã : {}", toEmail);
            }
            
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de rejet Ã  {}: {}", toEmail, e.getMessage(), e);
        }
    }

    /**
     * Envoie un email avec un lien de rÃ©initialisation de mot de passe
     *
     * @param toEmail         Email du destinataire
     * @param userName        Nom de l'utilisateur
     * @param resetToken      Token de rÃ©initialisation
     */
    public void sendPasswordResetEmail(String toEmail, String userName, String resetToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("RÃ©initialisation de votre mot de passe");
            
            String resetLink = buildFrontendHashLink(
                String.format("/reset-password?token=%s", resetToken)
            );
            
            String messageBody = String.format(
                "Bonjour %s,\n\n" +
                "Vous avez demandÃ© la rÃ©initialisation de votre mot de passe.\n\n" +
                "Veuillez cliquer sur le lien ci-dessous pour crÃ©er un nouveau mot de passe :\n\n" +
                "%s\n\n" +
                "Ce lien expire dans 24 heures.\n\n" +
                "Si vous n'avez pas demandÃ© cette rÃ©initialisation, vous pouvez ignorer cet email.\n\n" +
                "Cordialement,\n" +
                "AutoritÃ© de Certification Souveraine",
                userName,
                resetLink
            );
            
            message.setText(messageBody);
            
            boolean sent = sendOrLog(message);
            if (!debugMode && sent) {
                log.info("Email de rÃ©initialisation du mot de passe envoyÃ© Ã : {}", toEmail);
            }
            
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de rÃ©initialisation Ã  {}: {}", toEmail, e.getMessage(), e);
        }
    }

    /**
     * Envoie un email de confirmation de rÃ©initialisation de mot de passe rÃ©ussie
     *
     * @param toEmail   Email du destinataire
     * @param userName  Nom de l'utilisateur
     */
    public void sendPasswordResetConfirmationEmail(String toEmail, String userName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Votre mot de passe a Ã©tÃ© rÃ©initialisÃ©");
            
            String messageBody = String.format(
                "Bonjour %s,\n\n" +
                "Votre mot de passe a Ã©tÃ© rÃ©initialisÃ© avec succÃ¨s.\n\n" +
                "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.\n\n" +
                "Si vous n'avez pas effectuÃ© cette modification, veuillez contacter notre support immÃ©diatement.\n\n" +
                "Cordialement,\n" +
                "AutoritÃ© de Certification Souveraine",
                userName
            );
            
            message.setText(messageBody);
            
            boolean sent = sendOrLog(message);
            if (!debugMode && sent) {
                log.info("Email de confirmation de rÃ©initialisation envoyÃ© Ã : {}", toEmail);
            }
            
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de confirmation Ã  {}: {}", toEmail, e.getMessage(), e);
        }
    }

    /**
     * Envoie un email d'alerte avant expiration de certificat
     */
    public void sendCertificateExpiryEmail(String toEmail, String userName, String certificateId, String expiresAt) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Alerte expiration certificat");

            String messageBody = String.format(
                "Bonjour %s,\n\n" +
                "Votre certificat numerique (%s) arrive bientot a expiration.\n\n" +
                "Date d'expiration : %s\n\n" +
                "Nous vous recommandons de lancer un renouvellement des que possible.\n\n" +
                "Cordialement,\n" +
                "Autorite de Certification Souveraine",
                userName,
                certificateId,
                expiresAt
            );

            message.setText(messageBody);
            boolean sent = sendOrLog(message);
            if (!debugMode && sent) {
                log.info("Email d'expiration envoye a: {}", toEmail);
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'alerte expiration a {}: {}", toEmail, e.getMessage(), e);
        }
    }

    public boolean sendSimpleEmail(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            return sendOrLog(message);
        } catch (Exception e) {
            log.error("Erreur envoi email simple a {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
}
