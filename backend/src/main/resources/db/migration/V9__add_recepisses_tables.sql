-- Module Récépissés : tables recepisses + parametres

CREATE TABLE IF NOT EXISTS parametres (
    cle         VARCHAR(100) PRIMARY KEY,
    valeur      VARCHAR(500) NOT NULL,
    description VARCHAR(500)
);

INSERT INTO parametres (cle, valeur, description)
VALUES ('delai_expiration_defaut', '15', 'Délai de validité du récépissé en jours (modifiable par SuperAdmin)')
ON CONFLICT (cle) DO NOTHING;

INSERT INTO parametres (cle, valeur, description)
VALUES ('entite_code', 'ANTIC', 'Code entité utilisé dans la numérotation des récépissés')
ON CONFLICT (cle) DO NOTHING;

CREATE SEQUENCE IF NOT EXISTS recepisse_seq_daily
    START WITH 1
    INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS recepisses (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    numero                 VARCHAR(60) UNIQUE NOT NULL,
    certificate_request_id UUID        REFERENCES certificate_requests(id) ON DELETE SET NULL,
    demandeur_id           UUID        REFERENCES users(id) ON DELETE SET NULL,
    agent_id               UUID        REFERENCES users(id) ON DELETE SET NULL,
    nom_complet            VARCHAR(255),
    type_certificat        VARCHAR(100),
    date_generation        TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_expiration        TIMESTAMP   NOT NULL,
    statut                 VARCHAR(20) NOT NULL DEFAULT 'VALIDE'
                           CHECK (statut IN ('VALIDE','EXPIRE','ANNULE','REMPLACE')),
    hash_sha256            VARCHAR(64),
    chemin_pdf             VARCHAR(500),
    recepisse_remplace_id  UUID        REFERENCES recepisses(id) ON DELETE SET NULL,
    date_annulation        TIMESTAMP,
    motif_annulation       TEXT,
    created_at             TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recepisses_demandeur    ON recepisses(demandeur_id);
CREATE INDEX IF NOT EXISTS idx_recepisses_statut       ON recepisses(statut);
CREATE INDEX IF NOT EXISTS idx_recepisses_date_exp     ON recepisses(date_expiration);
CREATE INDEX IF NOT EXISTS idx_recepisses_request      ON recepisses(certificate_request_id);
