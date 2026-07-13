-- Paramètres système supplémentaires pour la configuration globale PKI

INSERT INTO parametres (cle, valeur, description)
VALUES ('otp_expiry_minutes', '15', 'Durée de validité du code OTP (en minutes)')
ON CONFLICT (cle) DO NOTHING;

INSERT INTO parametres (cle, valeur, description)
VALUES ('two_fa_expiry_minutes', '10', 'Durée de validité du code 2FA SMS (en minutes)')
ON CONFLICT (cle) DO NOTHING;

INSERT INTO parametres (cle, valeur, description)
VALUES ('certificat_validite_defaut_jours', '365', 'Durée de validité par défaut des certificats émis (en jours)')
ON CONFLICT (cle) DO NOTHING;

INSERT INTO parametres (cle, valeur, description)
VALUES ('rappel_expiration_jours', '30', 'Nombre de jours avant expiration pour envoyer un rappel aux titulaires')
ON CONFLICT (cle) DO NOTHING;

INSERT INTO parametres (cle, valeur, description)
VALUES ('max_login_attempts', '5', 'Nombre maximum de tentatives de connexion avant blocage temporaire du compte')
ON CONFLICT (cle) DO NOTHING;

INSERT INTO parametres (cle, valeur, description)
VALUES ('validation_token_expiry_hours', '24', 'Durée de validité du token de validation de certificat (en heures)')
ON CONFLICT (cle) DO NOTHING;

INSERT INTO parametres (cle, valeur, description)
VALUES ('password_reset_expiry_hours', '2', 'Durée de validité du lien de réinitialisation de mot de passe (en heures)')
ON CONFLICT (cle) DO NOTHING;
