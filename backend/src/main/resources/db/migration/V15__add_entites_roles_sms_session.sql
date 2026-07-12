-- ============================================================================
-- V15 : Entités, sous-profils admin, champs utilisateur (téléphone, KYC, SMS OTP, session)
-- ============================================================================

-- 1. Table des entités (AE Centrale et AEL)
CREATE TABLE IF NOT EXISTS entites (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) UNIQUE NOT NULL,
    nom         VARCHAR(255) NOT NULL,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('AE_CENTRALE', 'AEL')),
    parent_id   UUID        REFERENCES entites(id) ON DELETE SET NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entites_type      ON entites(type);
CREATE INDEX IF NOT EXISTS idx_entites_parent    ON entites(parent_id);

-- Entité par défaut : AE Centrale ANTIC
INSERT INTO entites (code, nom, type)
VALUES ('ANTIC', 'Agence Nationale des Technologies de l''Information et de la Communication', 'AE_CENTRALE')
ON CONFLICT (code) DO NOTHING;

-- 2. Colonnes supplémentaires sur users
ALTER TABLE users ADD COLUMN IF NOT EXISTS telephone       VARCHAR(25);
ALTER TABLE users ADD COLUMN IF NOT EXISTS statut_kyc      VARCHAR(20) DEFAULT 'NON_VERIFIE'
    CHECK (statut_kyc IN ('NON_VERIFIE', 'EN_COURS', 'VERIFIE', 'REJETE'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS entite_id       UUID REFERENCES entites(id) ON DELETE SET NULL;

-- OTP SMS (code distinct du OTP email)
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_sms_code       VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_sms_expires_at TIMESTAMP WITH TIME ZONE;

-- 2FA SMS
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_sms_code       VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_sms_expires_at TIMESTAMP WITH TIME ZONE;

-- Session timeout : suivi de la dernière activité + hash du refresh token actif
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at       TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_hash     VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_users_entite ON users(entite_id);

-- 3. Étendre le CHECK sur role pour accueillir les nouveaux sous-profils
--    (AE_CENTRALE, ADMIN_AEL, AEL déjà dans l'enum Java mais pas dans le CHECK SQL)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'AE_CENTRALE', 'ADMIN_AEL', 'AEL', 'USER'));

-- 4. Rattacher les admins existants à l'entité ANTIC
UPDATE users
SET entite_id = (SELECT id FROM entites WHERE code = 'ANTIC' LIMIT 1)
WHERE role IN ('ADMIN', 'SUPER_ADMIN', 'AE_CENTRALE')
  AND entite_id IS NULL;

-- 5. Paramètre délai session (30 min par défaut)
INSERT INTO parametres (cle, valeur, description)
VALUES ('session_timeout_minutes', '30', 'Durée d''inactivité avant expiration de session (minutes)')
ON CONFLICT (cle) DO NOTHING;
