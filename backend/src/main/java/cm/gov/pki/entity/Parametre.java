package cm.gov.pki.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "parametres")
public class Parametre {

    @Id
    @Column(length = 100)
    private String cle;

    @Column(nullable = false, length = 500)
    private String valeur;

    @Column(length = 500)
    private String description;

    public Parametre() {}

    public Parametre(String cle, String valeur, String description) {
        this.cle = cle;
        this.valeur = valeur;
        this.description = description;
    }

    public String getCle() { return cle; }
    public void setCle(String cle) { this.cle = cle; }

    public String getValeur() { return valeur; }
    public void setValeur(String valeur) { this.valeur = valeur; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
