-- Disable the legacy seeded admin account in already-migrated environments.
-- First admin creation is now handled by AdminBootstrapService with explicit env vars.
UPDATE users
SET is_active = false,
    updated_at = NOW()
WHERE email = 'admin@pki.local'
  AND role = 'ADMIN';
