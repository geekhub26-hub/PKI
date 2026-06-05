package cm.gov.pki.repository;

import cm.gov.pki.entity.CertificateRequest;
import cm.gov.pki.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificateRequestRepository extends JpaRepository<CertificateRequest, UUID> {
    List<CertificateRequest> findByUserOrderBySubmittedAtDesc(User user);
    Optional<CertificateRequest> findByIdAndUser(UUID id, User user);
    long countByStatus(String status);
    long countByStatusIn(java.util.Collection<String> statuses);

    // Admin queries
    List<CertificateRequest> findByStatusOrderBySubmittedAtDesc(String status);

    // Pageable admin query
    org.springframework.data.domain.Page<CertificateRequest> findByStatusIgnoreCase(String status, org.springframework.data.domain.Pageable pageable);
}
