package cm.gov.pki.repository;

import cm.gov.pki.entity.Recepisse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecepissRepository extends JpaRepository<Recepisse, UUID> {

    Optional<Recepisse> findByNumero(String numero);

    List<Recepisse> findByDemandeurIdOrderByDateGenerationDesc(UUID demandeurId);

    List<Recepisse> findAllByOrderByDateGenerationDesc();

    @Query("SELECT COUNT(r) FROM Recepisse r WHERE CAST(r.dateGeneration AS date) = CAST(:date AS date) AND r.numero LIKE :prefix%")
    long countByDateAndPrefix(LocalDateTime date, String prefix);

    @Query("SELECT r FROM Recepisse r WHERE r.statut = 'VALIDE' AND r.dateExpiration < :now")
    List<Recepisse> findExpiredToUpdate(LocalDateTime now);

    Optional<Recepisse> findByCertificateRequestId(UUID requestId);

    @Query("SELECT r FROM Recepisse r WHERE r.statut = 'VALIDE' AND r.dateExpiration >= :debut AND r.dateExpiration < :fin")
    List<Recepisse> findExpiringBetween(LocalDateTime debut, LocalDateTime fin);
}
