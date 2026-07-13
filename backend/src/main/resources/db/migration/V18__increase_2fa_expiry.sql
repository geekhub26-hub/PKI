-- Allonger la durée de validité du code 2FA de 10 à 30 minutes
-- Résout le problème de délai de livraison email (~5 min) qui faisait expirer le code
UPDATE parametres SET valeur = '30' WHERE cle = 'two_fa_expiry_minutes';
