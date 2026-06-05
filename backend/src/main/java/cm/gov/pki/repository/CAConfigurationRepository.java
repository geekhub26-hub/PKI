package cm.gov.pki.repository;

import cm.gov.pki.entity.CAConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CAConfigurationRepository extends JpaRepository<CAConfiguration, UUID> {
    Optional<CAConfiguration> findTopByOrderByCreatedAtDesc();
    Optional<CAConfiguration> findFirstByIsActiveTrueOrderByCreatedAtDesc();
    boolean existsByIsActiveTrue();
}
