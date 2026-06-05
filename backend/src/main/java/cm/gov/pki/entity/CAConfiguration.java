package cm.gov.pki.entity;

import jakarta.persistence.*;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ca_configuration")
@EntityListeners(AuditingEntityListener.class)

public class CAConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(name = "ca_name", nullable = false)
    public String caName;

    @Column(name = "ca_cert_path", nullable = false)
    public String caCertPath;

    @Column(name = "ca_key_path", nullable = false)
    public String caKeyPath;

    @Column(name = "ca_serial_path")
    public String caSerialPath;

    @Column(name = "ca_crl_path")
    public String caCrlPath;

    @Column(name = "valid_from")
    public LocalDateTime validFrom;

    @Column(name = "valid_until")
    public LocalDateTime validUntil;

    @Column(name = "key_algorithm")
    public String keyAlgorithm;

    @Column(name = "key_size")
    public Integer keySize;

    @Column(name = "signature_algorithm")
    public String signatureAlgorithm;

    @Column(name = "is_active")
    public Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    @CreatedDate
    public LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    public User createdBy;

    public String getSubjectDN() {
        return String.format("CN=%s, O=PKI Souverain, C=CM", caName);
    }

    public boolean isValid() {
        return Boolean.TRUE.equals(isActive) && LocalDateTime.now().isBefore(validUntil);
    }
}
