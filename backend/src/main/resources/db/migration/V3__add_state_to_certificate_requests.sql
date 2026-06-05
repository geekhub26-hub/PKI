-- Flyway migration V3: add state (region) to certificate_requests
ALTER TABLE certificate_requests
    ADD COLUMN IF NOT EXISTS state VARCHAR(255);

COMMENT ON COLUMN certificate_requests.state IS 'State / Region (ST) for CSR subject';
