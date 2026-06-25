package cm.gov.pki.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "recepisses", indexes = {
    @Index(name = "idx_recepisses_demandeur", columnList = "demandeur_id"),
    @Index(name = "idx_recepisses_statut",    columnList = "statut"),
    @Index(name = "idx_recepisses_date_exp",  columnList = "date_expiration"),
    @Index(name = "idx_recepisses_request",   columnList = "certificate_request_id")
})
public class Recepisse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 60)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificate_request_id")
    private CertificateRequest certificateRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demandeur_id")
    private User demandeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private User agent;

    @Column(name = "nom_complet", length = 255)
    private String nomComplet;

    @Column(name = "type_certificat", length = 100)
    private String typeCertificat;

    @Column(name = "date_generation", nullable = false)
    private LocalDateTime dateGeneration;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(name = "statut", nullable = false, length = 20)
    private String statut = "VALIDE";

    @Column(name = "hash_sha256", length = 64)
    private String hashSha256;

    @Column(name = "chemin_pdf", length = 500)
    private String cheminPdf;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recepisse_remplace_id")
    private Recepisse recepisseRemplace;

    @Column(name = "date_annulation")
    private LocalDateTime dateAnnulation;

    @Column(name = "motif_annulation", columnDefinition = "TEXT")
    private String motifAnnulation;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Recepisse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public CertificateRequest getCertificateRequest() { return certificateRequest; }
    public void setCertificateRequest(CertificateRequest certificateRequest) { this.certificateRequest = certificateRequest; }

    public User getDemandeur() { return demandeur; }
    public void setDemandeur(User demandeur) { this.demandeur = demandeur; }

    public User getAgent() { return agent; }
    public void setAgent(User agent) { this.agent = agent; }

    public String getNomComplet() { return nomComplet; }
    public void setNomComplet(String nomComplet) { this.nomComplet = nomComplet; }

    public String getTypeCertificat() { return typeCertificat; }
    public void setTypeCertificat(String typeCertificat) { this.typeCertificat = typeCertificat; }

    public LocalDateTime getDateGeneration() { return dateGeneration; }
    public void setDateGeneration(LocalDateTime dateGeneration) { this.dateGeneration = dateGeneration; }

    public LocalDateTime getDateExpiration() { return dateExpiration; }
    public void setDateExpiration(LocalDateTime dateExpiration) { this.dateExpiration = dateExpiration; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public String getHashSha256() { return hashSha256; }
    public void setHashSha256(String hashSha256) { this.hashSha256 = hashSha256; }

    public String getCheminPdf() { return cheminPdf; }
    public void setCheminPdf(String cheminPdf) { this.cheminPdf = cheminPdf; }

    public Recepisse getRecepisseRemplace() { return recepisseRemplace; }
    public void setRecepisseRemplace(Recepisse recepisseRemplace) { this.recepisseRemplace = recepisseRemplace; }

    public LocalDateTime getDateAnnulation() { return dateAnnulation; }
    public void setDateAnnulation(LocalDateTime dateAnnulation) { this.dateAnnulation = dateAnnulation; }

    public String getMotifAnnulation() { return motifAnnulation; }
    public void setMotifAnnulation(String motifAnnulation) { this.motifAnnulation = motifAnnulation; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isExpire() {
        return LocalDateTime.now().isAfter(dateExpiration);
    }
}
