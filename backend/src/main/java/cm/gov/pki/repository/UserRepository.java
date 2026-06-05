package cm.gov.pki.repository;

import cm.gov.pki.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
	Optional<User> findByEmail(String email);
	boolean existsByEmail(String email);
	Optional<User> findFirstByRoleOrderByCreatedAtDesc(User.UserRole role);
	Optional<User> findByPasswordResetToken(String passwordResetToken);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("update User u set u.lastLogin = :lastLogin, u.updatedAt = :lastLogin where u.id = :userId")
	int touchLastLogin(@Param("userId") UUID userId, @Param("lastLogin") LocalDateTime lastLogin);
}
