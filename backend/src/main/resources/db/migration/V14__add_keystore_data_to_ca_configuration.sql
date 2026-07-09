-- Store PKCS12 keystore bytes in DB so the CA private key survives
-- ephemeral-disk restarts (e.g. Render free tier).
ALTER TABLE ca_configuration
    ADD COLUMN IF NOT EXISTS keystore_data BYTEA;
