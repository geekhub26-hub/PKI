import { useEffect, useState } from 'react';
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

  function actionBadgeClass(action: string) {
    if (action.includes('REVOKED') || action.includes('REJECTED')) return 'status-badge status-revoked';
    if (action.includes('ISSUED') || action.includes('APPROVED') || action.includes('PUBLISHED')) return 'status-badge status-active';
    if (action.includes('LOGIN') || action.includes('REGISTER')) return 'status-badge status-pending';
    return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar">
        <h1 className="text-2xl font-bold text-white">Journal d'audit</h1>
        <p className="mt-1 text-sm text-white/70">
          Historique complet des actions sensibles.
        </p>
      </div>

      {/* Filter bar */}
      <div className="pki-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtrer :</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pki-input !py-1.5 !text-sm w-auto"
          >
            {ACTIONS.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary !py-1.5 !px-3 !text-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Préc
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{page} / {totalPages}</span>
          <button
            className="btn btn-primary !py-1.5 !px-3 !text-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Suiv
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Audit log table */}
      {loading ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">Chargement...</div>
      ) : (
        <div className="pki-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Utilisateur</th>
                  <th className="px-5 py-3">Entité</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      Aucun audit disponible.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <span className={actionBadgeClass(log.action)}>{log.action}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {log.userEmail || 'SYSTEM'}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {log.entityType} {log.entityId || ''}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.createdAt}
                      </td>
                      <td className="px-5 py-3">
                        {log.details && (
                          <pre className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-xs text-slate-600 dark:text-slate-300 max-w-xs overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Aucun audit disponible.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={actionBadgeClass(log.action)}>{log.action}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{log.createdAt}</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {log.userEmail || 'SYSTEM'} • {log.entityType} {log.entityId || ''}
                  </div>
                  {log.details && (
                    <pre className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2 text-xs text-slate-600 dark:text-slate-300 overflow-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
