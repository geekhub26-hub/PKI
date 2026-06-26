-- Hiérarchie admin : AE Centrale / Admin AEL / AEL
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'USER', 'SUPER_ADMIN', 'AE_CENTRALE', 'ADMIN_AEL', 'AEL'));
