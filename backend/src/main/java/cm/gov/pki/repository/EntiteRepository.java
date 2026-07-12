package cm.gov.pki.repository;

import cm.gov.pki.entity.Entite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EntiteRepository extends JpaRepository<Entite, UUID> {
    Optional<Entite> findByCode(String code);
    List<Entite> findByIsActiveTrue();
    List<Entite> findByTypeAndIsActiveTrue(Entite.TypeEntite type);
}
