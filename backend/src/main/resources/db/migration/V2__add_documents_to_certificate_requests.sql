ALTER TABLE certificate_requests
ADD COLUMN IF NOT EXISTS documents TEXT;

COMMENT ON COLUMN certificate_requests.documents IS 'Paths or filenames of uploaded documents for the request';
