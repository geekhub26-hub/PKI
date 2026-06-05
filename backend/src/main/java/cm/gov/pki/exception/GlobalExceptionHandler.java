package cm.gov.pki.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Gère les RuntimeException métier
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex, WebRequest request) {
        log.warn("⚠️ Erreur métier : {}", ex.getMessage());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", ex.getMessage());
        body.put("path", request.getDescription(false).replace("uri=", ""));

        // Déterminer le code HTTP basé sur le message d'erreur
        HttpStatus status = determineStatus(ex.getMessage());

        return new ResponseEntity<>(body, status);
    }

    /**
     * Gère les exceptions générales
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(Exception ex, WebRequest request) {
        log.error("❌ Erreur serveur : ", ex);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Erreur serveur interne");
        body.put("path", request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Détermine le code HTTP basé sur le message d'erreur
     */
    private HttpStatus determineStatus(String message) {
        if (message == null) {
            return HttpStatus.BAD_REQUEST;
        }

        // Conflits (email déjà existant)
        if (message.contains("déjà") || message.contains("existe") || message.contains("Cet email")) {
            return HttpStatus.CONFLICT;  // 409
        }

        // Erreurs d'authentification/autorisation
        if (message.contains("Email ou mot de passe") || 
            message.contains("inactif") || 
            message.contains("email non vérifié")) {
            return HttpStatus.UNAUTHORIZED;  // 401
        }

        // Par défaut
        return HttpStatus.BAD_REQUEST;  // 400
    }
}
