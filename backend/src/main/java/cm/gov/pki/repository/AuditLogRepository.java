package cm.gov.pki.repository;

import cm.gov.pki.entity.AuditLog;
import cm.gov.pki.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);
    List<AuditLog> findByUserOrderByCreatedAtDesc(User user);
    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);
    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
    boolean existsByActionAndEntityId(String action, UUID entityId);
}
