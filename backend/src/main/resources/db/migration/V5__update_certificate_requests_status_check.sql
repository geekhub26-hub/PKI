ALTER TABLE public.certificate_requests
DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

ALTER TABLE public.certificate_requests
ADD CONSTRAINT certificate_requests_status_check
CHECK (
  status IN (
    'PENDING',
    'PENDING_REVIEW',
    'NEEDS_CORRECTION',
    'REVIEW_APPROVED',
    'CSR_SUBMITTED',
    'APPROVED',
    'ISSUED',
    'REJECTED',
    'REVOKED'
  )
);
