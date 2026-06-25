-- Ajoute SUPER_ADMIN au rôle utilisateur et crée le compte bootstrap si nécessaire

-- Met à jour la contrainte CHECK pour autoriser SUPER_ADMIN
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'USER', 'SUPER_ADMIN'));
