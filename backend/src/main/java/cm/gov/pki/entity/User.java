package cm.gov.pki.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
// Suppression Lombok : constructeurs, setters manuels
public class User {

	public User() {}
	public User(UUID id, String email, String passwordHash, String firstName, String lastName, UserRole role, Boolean isActive, Boolean emailVerified, LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime lastLogin) {
		this.id = id;
		this.email = email;
		this.passwordHash = passwordHash;
		this.firstName = firstName;
		this.lastName = lastName;
		this.role = role;
		this.isActive = isActive;
		this.emailVerified = emailVerified;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.lastLogin = lastLogin;
	}
	public void setId(UUID id) { this.id = id; }
	public void setEmail(String email) { this.email = email; }
	public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
	public void setFirstName(String firstName) { this.firstName = firstName; }
	public void setLastName(String lastName) { this.lastName = lastName; }
	public void setRole(UserRole role) { this.role = role; }
	public void setIsActive(Boolean isActive) { this.isActive = isActive; }
	public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

	@Id
	@GeneratedValue(generator = "UUID")
	@GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
	@Column(columnDefinition = "uuid", updatable = false, nullable = false)
	private UUID id;

	@Column(unique = true, nullable = false)
	private String email;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Column(name = "first_name", nullable = false)
	private String firstName;

	@Column(name = "last_name", nullable = false)
	private String lastName;

	@Enumerated(EnumType.STRING)
	@Column(length = 20, nullable = false)
	private UserRole role;

	@Column(name = "is_active")
	private Boolean isActive = true;

	@Column(name = "email_verified")
	private Boolean emailVerified = false;

	@Column(name = "created_at")
	private LocalDateTime createdAt = LocalDateTime.now();

	@Column(name = "updated_at")
	private LocalDateTime updatedAt = LocalDateTime.now();

	@Column(name = "last_login")
	private LocalDateTime lastLogin;

	@Column(name = "password_reset_token")
	private String passwordResetToken;

	@Column(name = "password_reset_token_expires_at")
	private LocalDateTime passwordResetTokenExpiresAt;

	@Column(name = "otp_code")
	private String otpCode;

	@Column(name = "otp_expires_at")
	private LocalDateTime otpExpiresAt;

	@Column(name = "two_fa_code")
	private String twoFaCode;

	@Column(name = "two_fa_expires_at")
	private LocalDateTime twoFaExpiresAt;

	@Column(name = "avatar_url", columnDefinition = "TEXT")
	private String avatarUrl;

	public String getAvatarUrl() { return avatarUrl; }
	public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

	public UUID getId() {
		return this.id;
	}

	public String getFirstName() {
		return this.firstName;
	}

	public String getLastName() {
		return this.lastName;
	}

	public UserRole getRole() {
		return this.role;
	}

	public Boolean getIsActive() {
		return this.isActive;
	}

	public Boolean getEmailVerified() {
		return this.emailVerified;
	}

	public LocalDateTime getCreatedAt() {
		return this.createdAt;
	}

	public LocalDateTime getLastLogin() {
		return this.lastLogin;
	}

	public String getPasswordHash() {
		return this.passwordHash;
	}

	public void setLastLogin(LocalDateTime lastLogin) {
		this.lastLogin = lastLogin;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	public String getEmail() {
		return this.email;
	}

	public String getPasswordResetToken() {
		return this.passwordResetToken;
	}

	public void setPasswordResetToken(String passwordResetToken) {
		this.passwordResetToken = passwordResetToken;
	}

	public LocalDateTime getPasswordResetTokenExpiresAt() {
		return this.passwordResetTokenExpiresAt;
	}

	public void setPasswordResetTokenExpiresAt(LocalDateTime passwordResetTokenExpiresAt) {
		this.passwordResetTokenExpiresAt = passwordResetTokenExpiresAt;
	}

	public String getOtpCode() { return otpCode; }
	public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
	public LocalDateTime getOtpExpiresAt() { return otpExpiresAt; }
	public void setOtpExpiresAt(LocalDateTime otpExpiresAt) { this.otpExpiresAt = otpExpiresAt; }
	public String getTwoFaCode() { return twoFaCode; }
	public void setTwoFaCode(String twoFaCode) { this.twoFaCode = twoFaCode; }
	public LocalDateTime getTwoFaExpiresAt() { return twoFaExpiresAt; }
	public void setTwoFaExpiresAt(LocalDateTime twoFaExpiresAt) { this.twoFaExpiresAt = twoFaExpiresAt; }

	public enum UserRole {
		ADMIN, USER, SUPER_ADMIN, AE_CENTRALE, ADMIN_AEL, AEL
	}

	public static Builder builder() { return new Builder(); }

	public static class Builder {
		private UUID id;
		private String email;
		private String passwordHash;
		private String firstName;
		private String lastName;
		private UserRole role;
		private Boolean isActive = true;
		private Boolean emailVerified = false;
		private LocalDateTime createdAt;
		private LocalDateTime updatedAt;
		private LocalDateTime lastLogin;

		public Builder id(UUID id) { this.id = id; return this; }
		public Builder email(String email) { this.email = email; return this; }
		public Builder passwordHash(String passwordHash) { this.passwordHash = passwordHash; return this; }
		public Builder firstName(String firstName) { this.firstName = firstName; return this; }
		public Builder lastName(String lastName) { this.lastName = lastName; return this; }
		public Builder role(UserRole role) { this.role = role; return this; }
		public Builder isActive(Boolean isActive) { this.isActive = isActive; return this; }
		public Builder emailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; return this; }
		public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
		public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
		public Builder lastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; return this; }

		public User build() {
			User u = new User();
			u.id = this.id;
			u.email = this.email;
			u.passwordHash = this.passwordHash;
			u.firstName = this.firstName;
			u.lastName = this.lastName;
			u.role = this.role;
			u.isActive = this.isActive;
			u.emailVerified = this.emailVerified;
			u.createdAt = this.createdAt == null ? LocalDateTime.now() : this.createdAt;
			u.updatedAt = this.updatedAt == null ? LocalDateTime.now() : this.updatedAt;
			u.lastLogin = this.lastLogin;
			return u;
		}
	}

	public boolean canLogin() {
		return Boolean.TRUE.equals(isActive) && Boolean.TRUE.equals(emailVerified);
	}

	public boolean isAdmin() {
		return role == UserRole.ADMIN || role == UserRole.SUPER_ADMIN
			|| role == UserRole.AE_CENTRALE || role == UserRole.ADMIN_AEL || role == UserRole.AEL;
	}

	public boolean isSuperAdmin() {
		return role == UserRole.SUPER_ADMIN;
	}
}
