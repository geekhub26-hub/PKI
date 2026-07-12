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

    // Filtrage par entité de l'utilisateur demandeur
    @org.springframework.data.jpa.repository.Query("select r from CertificateRequest r where r.user.entite.id = :entiteId")
    org.springframework.data.domain.Page<CertificateRequest> findByUserEntiteId(@org.springframework.data.repository.query.Param("entiteId") UUID entiteId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("select r from CertificateRequest r where r.user.entite.id = :entiteId and lower(r.status) = lower(:status)")
    org.springframework.data.domain.Page<CertificateRequest> findByUserEntiteIdAndStatus(@org.springframework.data.repository.query.Param("entiteId") UUID entiteId, @org.springframework.data.repository.query.Param("status") String status, org.springframework.data.domain.Pageable pageable);

    long countByStatusInAndUser_Entite_Id(java.util.Collection<String> statuses, UUID entiteId);

    // Stats avancées : délai moyen de traitement (en heures) pour les demandes traitées
    @org.springframework.data.jpa.repository.Query(
        "select avg(function('EXTRACT', 'EPOCH', r.reviewedAt) - function('EXTRACT', 'EPOCH', r.submittedAt)) / 3600.0 " +
        "from CertificateRequest r where r.reviewedAt is not null and r.submittedAt is not null " +
        "and (:from is null or r.submittedAt >= :from) and (:to is null or r.submittedAt <= :to)")
    Double avgProcessingHours(
        @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
        @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to);

    // Top 5 entités par nombre de demandes
    @org.springframework.data.jpa.repository.Query(
        "select r.user.entite.nom, count(r) as cnt from CertificateRequest r " +
        "where r.user.entite is not null " +
        "and (:from is null or r.submittedAt >= :from) and (:to is null or r.submittedAt <= :to) " +
        "group by r.user.entite.id, r.user.entite.nom order by cnt desc")
    java.util.List<Object[]> top5EntitesByRequests(
        @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
        @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to,
        org.springframework.data.domain.Pageable pageable);

    // Comptage par statut avec filtres date
    @org.springframework.data.jpa.repository.Query(
        "select r.status, count(r) from CertificateRequest r " +
        "where (:from is null or r.submittedAt >= :from) and (:to is null or r.submittedAt <= :to) " +
        "and (:entiteId is null or r.user.entite.id = :entiteId) " +
        "group by r.status")
    java.util.List<Object[]> countByStatusGrouped(
        @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
        @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to,
        @org.springframework.data.repository.query.Param("entiteId") UUID entiteId);
}
