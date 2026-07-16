-- Ajout des champs paiement SharePay + nouveaux statuts
ALTER TABLE certificate_requests
  ADD COLUMN IF NOT EXISTS sharepay_reference VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_initiated_at TIMESTAMP;

ALTER TABLE certificate_requests
  DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

ALTER TABLE certificate_requests
  ADD CONSTRAINT certificate_requests_status_check
  CHECK (
    status IN (
      'PENDING',
      'PENDING_REVIEW',
      'NEEDS_CORRECTION',
      'REVIEW_APPROVED',
      'AWAITING_PAYMENT',
      'PAYMENT_CONFIRMED',
      'CSR_SUBMITTED',
      'APPROVED',
      'ISSUED',
      'REJECTED',
      'REVOKED'
    )
  );
