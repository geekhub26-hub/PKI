package cm.gov.pki.repository;

import cm.gov.pki.entity.Recepisse;
import cm.gov.pki.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    // Tous les récépissés dont l'agent appartient à une entité donnée
    @Query("SELECT r FROM Recepisse r WHERE r.agent IS NOT NULL AND r.agent.entite.id = :entiteId ORDER BY r.dateGeneration DESC")
    List<Recepisse> findByAgentEntiteId(@Param("entiteId") UUID entiteId);

    // Top N entités par volume (global)
    @Query("SELECT r.agent.entite.id, r.agent.entite.nom, COUNT(r) FROM Recepisse r WHERE r.agent IS NOT NULL AND r.agent.entite IS NOT NULL GROUP BY r.agent.entite.id, r.agent.entite.nom ORDER BY COUNT(r) DESC")
    List<Object[]> top5EntitesGlobal(Pageable pageable);

    // Top N entités pour une entité spécifique
    @Query("SELECT r.agent.entite.id, r.agent.entite.nom, COUNT(r) FROM Recepisse r WHERE r.agent IS NOT NULL AND r.agent.entite.id = :entiteId GROUP BY r.agent.entite.id, r.agent.entite.nom ORDER BY COUNT(r) DESC")
    List<Object[]> top5EntitesForEntite(@Param("entiteId") UUID entiteId);

    // Top N agents AEL par volume (global)
    @Query("SELECT r.agent.id, r.agent.firstName, r.agent.lastName, r.agent.email, COUNT(r) FROM Recepisse r WHERE r.agent IS NOT NULL GROUP BY r.agent.id, r.agent.firstName, r.agent.lastName, r.agent.email ORDER BY COUNT(r) DESC")
    List<Object[]> top5AgentsGlobal(Pageable pageable);

    // Top N agents AEL pour une entité
    @Query("SELECT r.agent.id, r.agent.firstName, r.agent.lastName, r.agent.email, COUNT(r) FROM Recepisse r WHERE r.agent IS NOT NULL AND r.agent.entite.id = :entiteId GROUP BY r.agent.id, r.agent.firstName, r.agent.lastName, r.agent.email ORDER BY COUNT(r) DESC")
    List<Object[]> top5AgentsForEntite(@Param("entiteId") UUID entiteId);

    @Modifying
    @Query("UPDATE Recepisse r SET r.demandeur = null WHERE r.demandeur = :user")
    void detachDemandeur(@Param("user") User user);

    @Modifying
    @Query("UPDATE Recepisse r SET r.agent = null WHERE r.agent = :user")
    void detachAgent(@Param("user") User user);
}
