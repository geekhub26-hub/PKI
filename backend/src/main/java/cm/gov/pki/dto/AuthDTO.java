package cm.gov.pki.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;


import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTOs pour l'authentification
 */
public class AuthDTO {
    public static class LoginRequest {
        @NotBlank(message = "L'email est requis")
        @Email(message = "Format d'email invalide")
        private String email;

        @NotBlank(message = "Le mot de passe est requis")
        private String password;

        public LoginRequest() {}
        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }
        public String getEmail() { return this.email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return this.password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        @NotBlank(message = "L'email est requis")
        @Email(message = "Format d'email invalide")
        private String email;

        @NotBlank(message = "Le mot de passe est requis")
        @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
        private String password;

        @NotBlank(message = "Le prénom est requis")
        @Size(max = 100)
        private String firstName;

        @NotBlank(message = "Le nom est requis")
        @Size(max = 100)
        private String lastName;

        public RegisterRequest() {}
        public RegisterRequest(String email, String password, String firstName, String lastName) {
            this.email = email;
            this.password = password;
            this.firstName = firstName;
            this.lastName = lastName;
        }
        public String getEmail() { return this.email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return this.password; }
        public void setPassword(String password) { this.password = password; }
        public String getFirstName() { return this.firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return this.lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
    }

    public static class JwtResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private Long expiresIn;
        private UserDTO user;
        public JwtResponse() {}
        public JwtResponse(String accessToken, String refreshToken, String tokenType, Long expiresIn, UserDTO user) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.tokenType = tokenType;
            this.expiresIn = expiresIn;
            this.user = user;
        }
        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
        public String getTokenType() { return tokenType; }
        public void setTokenType(String tokenType) { this.tokenType = tokenType; }
        public Long getExpiresIn() { return expiresIn; }
        public void setExpiresIn(Long expiresIn) { this.expiresIn = expiresIn; }
        public UserDTO getUser() { return user; }
        public void setUser(UserDTO user) { this.user = user; }
    }

    public static class UserDTO {
        private UUID id;
        private String email;
        private String firstName;
        private String lastName;
        private String role;
        private Boolean isActive;
        private Boolean emailVerified;
        private LocalDateTime createdAt;
        private LocalDateTime lastLogin;

        public UserDTO() {}
        public UserDTO(UUID id, String email, String firstName, String lastName, String role, Boolean isActive, Boolean emailVerified, LocalDateTime createdAt, LocalDateTime lastLogin) {
            this.id = id;
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
            this.role = role;
            this.isActive = isActive;
            this.emailVerified = emailVerified;
            this.createdAt = createdAt;
            this.lastLogin = lastLogin;
        }
        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
        public Boolean getEmailVerified() { return emailVerified; }
        public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getLastLogin() { return lastLogin; }
        public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
        public String getFullName() {
            return firstName + " " + lastName;
        }
    }

    public static class RefreshTokenRequest {
        @NotBlank(message = "Le refresh token est requis")
        private String refreshToken;
        public RefreshTokenRequest() {}
        public RefreshTokenRequest(String refreshToken) {
            this.refreshToken = refreshToken;
        }
        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    }
}