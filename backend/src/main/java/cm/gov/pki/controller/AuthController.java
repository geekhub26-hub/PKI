package cm.gov.pki.controller;

import cm.gov.pki.dto.AuthDTO;
import cm.gov.pki.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	public ResponseEntity<?> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
		try {
			return ResponseEntity.ok(authService.register(request));
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
		}
	}

	@PostMapping("/verify-otp")
	public ResponseEntity<?> verifyOtp(@RequestBody AuthDTO.OtpVerifyRequest request) {
		try {
			AuthDTO.UserDTO user = authService.verifyOtp(request.getEmail(), request.getCode());
			return ResponseEntity.ok(user);
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
		}
	}

	@PostMapping("/resend-otp")
	public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
		try {
			authService.resendOtp(body.getOrDefault("email", ""));
			return ResponseEntity.ok(Map.of("message", "Code renvoyé"));
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
		}
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
		try {
			return ResponseEntity.ok(authService.login(request));
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
		}
	}

	@PostMapping("/verify-2fa")
	public ResponseEntity<?> verify2Fa(@RequestBody AuthDTO.TwoFaVerifyRequest request) {
		try {
			return ResponseEntity.ok(authService.verify2Fa(request.getPendingToken(), request.getCode()));
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
		}
	}

	@PostMapping("/refresh")
	public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
		String refreshToken = body.get("refreshToken");
		if (refreshToken == null || refreshToken.isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("error", "refreshToken requis"));
		}
		try {
			return ResponseEntity.ok(authService.refreshAccessToken(refreshToken));
		} catch (RuntimeException e) {
			return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
		}
	}

	@PostMapping("/logout")
	public ResponseEntity<?> logout(@RequestBody(required = false) Map<String, String> body) {
		String refreshToken = body != null ? body.get("refreshToken") : null;
		authService.logout(refreshToken);
		return ResponseEntity.ok(Map.of("message", "Déconnecté avec succès"));
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
		String email = request.get("email");
		if (email == null || email.isBlank()) {
			return ResponseEntity.status(400).body(Map.of("error", "Email requis"));
		}
		try {
			authService.requestPasswordReset(email);
		} catch (RuntimeException ignored) {}
		return ResponseEntity.ok(Map.of("message", "Email de réinitialisation envoyé"));
	}

	@PostMapping("/reset-password")
	public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
		String token = request.get("token");
		String newPassword = request.get("password");
		if (token == null || token.isBlank())       return ResponseEntity.badRequest().body(Map.of("error", "Token requis"));
		if (newPassword == null || newPassword.length() < 8)
			return ResponseEntity.badRequest().body(Map.of("error", "Mot de passe trop court (8 car. min)"));
		try {
			authService.resetPassword(token, newPassword);
			return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès"));
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
		}
	}
}
