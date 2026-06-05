package cm.gov.pki.repository;

import cm.gov.pki.entity.Certificate;
import cm.gov.pki.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, UUID> {
    List<Certificate> findByUserOrderByIssuedAtDesc(User user);
    Page<Certificate> findByStatus(Certificate.CertificateStatus status, Pageable pageable);
    Optional<Certificate> findBySerialNumber(String serialNumber);
    List<Certificate> findByStatusAndNotAfterBefore(Certificate.CertificateStatus status, LocalDateTime date);
    long countByStatus(Certificate.CertificateStatus status);
    boolean existsBySerialNumber(String serialNumber);
    Optional<Certificate> findFirstByRequestId(UUID requestId);
}
