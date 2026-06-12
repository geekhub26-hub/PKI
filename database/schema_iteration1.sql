-- ============================================================================
-- SCHÉMA POSTGRESQL - ITÉRATION 1 : Le Cœur de Confiance & Accès
-- Système Souverain de Gestion d'Identité (PKI)
-- ============================================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour crypto (hashage de mots de passe)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TABLE : users
-- Gestion des utilisateurs (Admin et User)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'USER')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Index pour optimisation des recherches
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- TABLE : ca_configuration
-- Configuration de l'Autorité de Certification Racine
-- ============================================================================
CREATE TABLE ca_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ca_name VARCHAR(255) NOT NULL,
    ca_cert_path VARCHAR(500) NOT NULL,
    ca_key_path VARCHAR(500) NOT NULL,
    ca_serial_path VARCHAR(500),
    ca_crl_path VARCHAR(500),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    key_algorithm VARCHAR(50) DEFAULT 'RSA',
    key_size INTEGER DEFAULT 4096,
    signature_algorithm VARCHAR(50) DEFAULT 'SHA256withRSA',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- ============================================================================
-- TABLE : certificate_requests (CSR)
-- Demandes de certificats utilisateurs
-- ============================================================================
CREATE TABLE certificate_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Champs Distinguished Name (DN) X.509
    common_name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    organizational_unit VARCHAR(255),
    locality VARCHAR(255),
    country VARCHAR(2),
    email VARCHAR(255) NOT NULL,
    
    -- Métadonnées de la demande
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'ISSUED', 'REVOKED')
    ),
    csr_content TEXT,
    
    -- Workflow de validation
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    validation_token VARCHAR(255),
    token_expires_at TIMESTAMP WITH TIME ZONE,
    token_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Traçabilité
    rejection_reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certificate_requests_user_id ON certificate_requests(user_id);
CREATE INDEX idx_certificate_requests_status ON certificate_requests(status);
CREATE INDEX idx_certificate_requests_submitted_at ON certificate_requests(submitted_at);

-- ============================================================================
-- TABLE : certificates
-- Certificats émis et leur cycle de vie
-- ============================================================================
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES certificate_requests(id),
    
    -- Identifiants du certificat
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    fingerprint_sha256 VARCHAR(64) UNIQUE NOT NULL,
    
    -- Contenu du certificat
    certificate_pem TEXT NOT NULL,
    public_key_pem TEXT,
    
    -- Métadonnées X.509
    subject_dn VARCHAR(500) NOT NULL,
    issuer_dn VARCHAR(500) NOT NULL,
    
    -- Validité
    not_before TIMESTAMP WITH TIME ZONE NOT NULL,
    not_after TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- État du certificat
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED')
    ),
    
    -- Révocation
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),
    revocation_reason VARCHAR(255),
    
    -- Traçabilité
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    issued_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_serial_number ON certificates(serial_number);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_not_after ON certificates(not_after);

-- ============================================================================
-- TABLE : audit_logs
-- Journal d'audit inaltérable (Itération 1 basique, amélioré en Itération 4)
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- TABLE : system_statistics
-- Statistiques système pour le Dashboard Admin
-- ============================================================================
CREATE TABLE system_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_metadata JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_statistics_metric_name ON system_statistics(metric_name);
CREATE INDEX idx_system_statistics_recorded_at ON system_statistics(recorded_at);

-- ============================================================================
-- FUNCTIONS : Triggers pour updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application des triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_requests_updated_at BEFORE UPDATE ON certificate_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONNÉES INITIALES
-- ============================================================================
-- Aucun compte administrateur n'est créé avec un mot de passe codé en dur.
-- Le bootstrap admin est géré par l'application via variables d'environnement.

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue : Statistiques globales pour Dashboard Admin
CREATE VIEW v_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'USER') AS total_users,
    (SELECT COUNT(*) FROM certificate_requests WHERE status = 'PENDING') AS pending_requests,
    (SELECT COUNT(*) FROM certificates WHERE status = 'ACTIVE') AS active_certificates,
    (SELECT COUNT(*) FROM certificates WHERE status = 'REVOKED') AS revoked_certificates,
    (SELECT is_active FROM ca_configuration ORDER BY created_at DESC LIMIT 1) AS ca_status;

-- Vue : Demandes en attente pour Admin
CREATE VIEW v_pending_requests AS
SELECT 
    cr.id,
    cr.common_name,
    cr.organization,
    cr.email,
    cr.submitted_at,
    u.email AS user_email,
    CONCAT(u.first_name, ' ', u.last_name) AS user_full_name
FROM certificate_requests cr
JOIN users u ON cr.user_id = u.id
WHERE cr.status = 'PENDING'
ORDER BY cr.submitted_at ASC;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON TABLE users IS 'Utilisateurs du système (ADMIN et USER)';
COMMENT ON TABLE ca_configuration IS 'Configuration de l''Autorité de Certification Racine';
COMMENT ON TABLE certificate_requests IS 'Demandes de certificats X.509 (CSR)';
COMMENT ON TABLE certificates IS 'Certificats émis et leur cycle de vie';
COMMENT ON TABLE audit_logs IS 'Journal d''audit des actions système';
COMMENT ON TABLE system_statistics IS 'Métriques système pour monitoring';

-- ============================================================================
-- FIN DU SCHÉMA ITÉRATION 1
-- ============================================================================
