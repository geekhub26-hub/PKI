import { useEffect, useState } from 'react';
import Button from '../components/Button';
import { adminService } from '../services/api';

const ACTIONS = [
  'ALL',
  'USER_LOGIN',
  'USER_REGISTER',
  'REQUEST_SUBMITTED',
  'REQUEST_UPDATED',
  'CSR_SUBMITTED',
  'CSR_APPROVED',
  'CSR_REJECTED',
  'TOKEN_VALIDATED',
  'CERTIFICATE_ISSUED',
  'CERTIFICATE_REVOKED',
  'CRL_PUBLISHED',
  'CERTIFICATE_EXPIRING_SOON',
  'CERTIFICATE_RENEWED',
];

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAuditLogs(actionFilter, page - 1, pageSize);
      setLogs(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement des audits.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    load();
  }, [actionFilter]);

  useEffect(() => {
    load();
  }, [page]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          Audit & Traçabilité
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Journal d'audit</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Historique complet des actions sensibles.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Filtrer</label>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          {ACTIONS.map((action) => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{log.action}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">{log.createdAt}</div>
              </div>
              <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {log.userEmail || 'SYSTEM'} • {log.entityType} {log.entityId || ''}
              </div>
              {log.details && (
                <pre className="mt-2 rounded-lg bg-neutral-100 p-2 text-xs text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}

          {logs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
              Aucun audit disponible.
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prec</Button>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">{page} / {totalPages}</div>
        <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Suiv</Button>
      </div>
    </div>
  );
}
