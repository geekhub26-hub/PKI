-- Ajout des colonnes pour la réinitialisation du mot de passe
ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN password_reset_token_expires_at TIMESTAMP;

-- Créer un index pour trouver rapidement un utilisateur par token
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
