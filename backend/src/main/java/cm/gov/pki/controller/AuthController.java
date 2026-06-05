package cm.gov.pki.controller;

import cm.gov.pki.dto.AuthDTO;
import cm.gov.pki.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping({"/auth", "/api/auth"})
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthDTO.UserDTO> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
		AuthDTO.UserDTO user = authService.register(request);
		return ResponseEntity.ok(user);
	}

	@PostMapping("/login")
	public ResponseEntity<AuthDTO.JwtResponse> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
		AuthDTO.JwtResponse jwt = authService.login(request);
		return ResponseEntity.ok(jwt);
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> request) {
		String email = request.get("email");
		if (email == null || email.isBlank()) {
			return ResponseEntity.status(400).body(java.util.Map.of("error", "Email requis"));
		}
		try {
			authService.requestPasswordReset(email);
			return ResponseEntity.ok(java.util.Map.of("message", "Email de réinitialisation envoyé"));
		} catch (RuntimeException e) {
			// Ne pas révéler si l'email existe ou non pour la sécurité
			return ResponseEntity.ok(java.util.Map.of("message", "Email de réinitialisation envoyé"));
		}
	}

	@PostMapping("/reset-password")
	public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> request) {
		String token = request.get("token");
		String newPassword = request.get("password");
		
		if (token == null || token.isBlank()) {
			return ResponseEntity.status(400).body(java.util.Map.of("error", "Token requis"));
		}
		if (newPassword == null || newPassword.isBlank()) {
			return ResponseEntity.status(400).body(java.util.Map.of("error", "Mot de passe requis"));
		}
		if (newPassword.length() < 8) {
			return ResponseEntity.status(400).body(java.util.Map.of("error", "Le mot de passe doit contenir au moins 8 caractères"));
		}

		try {
			authService.resetPassword(token, newPassword);
			return ResponseEntity.ok(java.util.Map.of("message", "Mot de passe réinitialisé avec succès"));
		} catch (RuntimeException e) {
			return ResponseEntity.status(400).body(java.util.Map.of("error", e.getMessage()));
		}
	}
}