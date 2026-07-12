package cm.gov.pki.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "entites")
public class Entite {

    public enum TypeEntite { AE_CENTRALE, AEL }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeEntite type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Entite parent;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Entite() {}

    public UUID getId()               { return id; }
    public String getCode()           { return code; }
    public String getNom()            { return nom; }
    public TypeEntite getType()       { return type; }
    public Entite getParent()         { return parent; }
    public boolean isActive()         { return isActive; }
    public LocalDateTime getCreatedAt(){ return createdAt; }

    public void setId(UUID id)             { this.id = id; }
    public void setCode(String code)       { this.code = code; }
    public void setNom(String nom)         { this.nom = nom; }
    public void setType(TypeEntite type)   { this.type = type; }
    public void setParent(Entite parent)   { this.parent = parent; }
    public void setActive(boolean active)  { this.isActive = active; }
    public void setCreatedAt(LocalDateTime t){ this.createdAt = t; }
}
