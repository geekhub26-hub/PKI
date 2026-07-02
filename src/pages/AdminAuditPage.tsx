import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { Activity, Filter } from 'lucide-react';

const ACTIONS = [
  'ALL', 'USER_LOGIN', 'USER_REGISTER', 'REQUEST_SUBMITTED', 'REQUEST_UPDATED',
  'CSR_SUBMITTED', 'CSR_APPROVED', 'CSR_REJECTED', 'TOKEN_VALIDATED',
  'CERTIFICATE_ISSUED', 'CERTIFICATE_REVOKED', 'CRL_PUBLISHED',
  'CERTIFICATE_EXPIRING_SOON', 'CERTIFICATE_RENEWED',
];

export default function AdminAuditPage() {
  const [logs, setLogs]             = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(1);
  const [pageSize]                  = useState(15);
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

  useEffect(() => { setPage(1); load(); }, [actionFilter]);
  useEffect(() => { load(); }, [page]);

  function actionBadgeClass(action: string) {
    if (action.includes('REVOKED') || action.includes('REJECTED')) return 'status-badge status-revoked';
    if (action.includes('ISSUED') || action.includes('APPROVED') || action.includes('PUBLISHED')) return 'status-badge status-active';
    if (action.includes('LOGIN') || action.includes('REGISTER')) return 'status-badge status-pending';
    return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Activity size={22} /> Journal d'audit
          </h1>
          <p className="mt-0.5 text-sm text-white/60">Historique complet des actions sensibles</p>
        </div>
      </div>

      {/* Filter + pagination bar */}
      <div className="pki-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Filter size={12} /> Filtrer
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="pki-input py-1.5 text-sm"
              style={{ width: 'auto', minWidth: '200px' }}
            >
              {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Préc
            </button>
            <span className="min-w-[64px] text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Suiv →
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      ) : (
        <div className="pki-card overflow-hidden">
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="pki-table" style={{ minWidth: '680px' }}>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Utilisateur</th>
                  <th>Entité</th>
                  <th>Date</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      Aucun audit disponible.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className={actionBadgeClass(log.action)}>{log.action}</span>
                      </td>
                      <td className="text-sm font-medium">{log.userEmail || 'SYSTEM'}</td>
                      <td className="text-xs text-slate-500">{log.entityType} {log.entityId || ''}</td>
                      <td className="whitespace-nowrap text-xs text-slate-500">{log.createdAt}</td>
                      <td>
                        {log.details && (
                          <pre className="max-w-xs overflow-auto rounded-lg bg-slate-100 dark:bg-slate-800 p-1.5 text-xs text-slate-600 dark:text-slate-300">
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

          {/* Mobile */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 md:hidden">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">Aucun audit disponible.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={actionBadgeClass(log.action)}>{log.action}</span>
                    <span className="text-xs text-slate-500">{log.createdAt}</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {log.userEmail || 'SYSTEM'} • {log.entityType} {log.entityId || ''}
                  </div>
                  {log.details && (
                    <pre className="overflow-auto rounded-lg bg-slate-100 dark:bg-slate-800 p-2 text-xs text-slate-600 dark:text-slate-300">
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
