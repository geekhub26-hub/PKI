import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';

export default function AdminRequestsList() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const statusOptions = [
    { value: 'ALL', label: 'Toutes' },
    { value: 'PENDING', label: 'PENDING' },
    { value: 'PENDING_REVIEW', label: 'PENDING_REVIEW' },
    { value: 'REVIEW_APPROVED', label: 'REVIEW_APPROVED' },
    { value: 'CSR_SUBMITTED', label: 'CSR_SUBMITTED' },
    { value: 'NEEDS_CORRECTION', label: 'NEEDS_CORRECTION' },
    { value: 'ISSUED', label: 'ISSUED' },
    { value: 'REJECTED', label: 'REJECTED' },
  ];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getCertificateRequests(
        statusFilter === 'ALL' ? undefined : statusFilter,
        page - 1,
        pageSize,
      );
      setRequests(res.items);
      setTotal(res.total);
      const totalPages = Math.max(1, Math.ceil(res.total / res.size));
      if (page > totalPages) setPage(totalPages);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load();
  }, [statusFilter, pageSize]);

  useEffect(() => {
    load();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Demandes de certificats</h1>
          <p className="mt-1 text-sm text-white/70">
            Analysez les dossiers entrants, appliquez les statuts et accédez aux demandes en un clic.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/60">Total</div>
            <div className="text-lg font-bold text-white">{total}</div>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/60">Page</div>
            <div className="text-lg font-bold text-white">
              {currentPage} / {totalPages}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="pki-card p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Filtre statut</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pki-input py-1.5 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {total} résultat(s)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">Affichage</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="pki-input py-1.5 text-sm w-20"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-primary py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-primary py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="pki-card p-6 text-sm text-slate-500 dark:text-slate-400">Chargement...</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop table */}
          <div className="pki-card overflow-hidden hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">CN</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Soumis</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{r.id}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.userEmail || r.userId}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.commonName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={getStatusClass(r.status)}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/requests/${r.id}`)}
                        className="btn btn-primary py-1 px-3 text-xs"
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                      colSpan={6}
                    >
                      Aucune demande trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-4 md:hidden">
            {requests.map((r) => (
              <div key={r.id} className="pki-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {r.commonName || 'Demande'}
                  </div>
                  <span className={getStatusClass(r.status)}>{r.status}</span>
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">{r.id}</div>
                <div className="text-sm text-slate-700 dark:text-slate-200">{r.userEmail || r.userId}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => navigate(`/admin/requests/${r.id}`)}
                    className="btn btn-primary py-1.5 px-4 text-xs"
                  >
                    Voir
                  </button>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="pki-card p-6 text-center text-sm text-slate-500 dark:text-slate-400 border-dashed">
                Aucune demande trouvée.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusClass(status?: string): string {
  const value = (status || 'INCONNU').toUpperCase();
  switch (value) {
    case 'PENDING':
    case 'PENDING_REVIEW':
      return 'status-badge status-pending';
    case 'ISSUED':
      return 'status-badge status-active';
    case 'REJECTED':
      return 'status-badge status-revoked';
    case 'NEEDS_CORRECTION':
      return 'status-badge status-rejected';
    case 'REVIEW_APPROVED':
    case 'CSR_SUBMITTED':
      return 'status-badge status-pending';
    default:
      return 'status-badge status-pending';
  }
}
