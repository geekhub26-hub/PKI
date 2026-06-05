ALTER TABLE public.certificate_requests
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS birth_date DATE,
    ADD COLUMN IF NOT EXISTS birth_place VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nationality VARCHAR(2),
    ADD COLUMN IF NOT EXISTS identity_document_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS identity_document_number VARCHAR(255),
    ADD COLUMN IF NOT EXISTS identity_document_expiry DATE;

