import { useEffect, useState } from 'react';
import Button from '../components/Button';
import { AdminCertificate, adminService } from '../services/api';

export default function AdminRevokeCertificatePage() {
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getCertificates(statusFilter, page - 1, pageSize);
      setCertificates(res.items || []);
      setTotalPages(res.totalPages || 1);
      if (page > (res.totalPages || 1)) setPage(res.totalPages || 1);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    load();
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [page]);

  async function handleRevoke(id: string) {
    setActionMessage(null);
    setError(null);
    try {
      await adminService.revokeCertificate(id, reasons[id]);
      setActionMessage('Certificat revoque avec succes.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la revocation.');
    }
  }

  const statuses = ['ALL', 'ACTIVE', 'REVOKED', 'EXPIRED', 'SUSPENDED'];

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          Revocation
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Revoquer un certificat</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Revoquez un certificat actif et publiez automatiquement la nouvelle CRL.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Filtrer</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {actionMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          {actionMessage}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Chargement...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <div key={cert.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {cert.subjectDN?.split(',')[0]?.replace('CN=', '') || cert.id}
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {cert.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{cert.userEmail || cert.userId}</div>
              <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                Serie: {cert.serialNumber}
              </div>

              {cert.status === 'ACTIVE' ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                    placeholder="Raison de revocation (optionnel)"
                    value={reasons[cert.id] || ''}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                  />
                  <Button onClick={() => handleRevoke(cert.id)}>Revoquer</Button>
                </div>
              ) : (
                <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                  Revocation: {cert.revocationReason || 'N/A'}
                </div>
              )}
            </div>
          ))}

          {certificates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
              Aucun certificat trouve.
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prec</Button>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {page} / {totalPages}
        </div>
        <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Suiv</Button>
      </div>
    </div>
  );
}
