import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import { Filter, ChevronRight } from 'lucide-react';

export default function AdminRequestsList() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [requests, setRequests]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState<number>(10);
  const [total, setTotal]               = useState(0);
  const navigate = useNavigate();

  const statusOptions = [
    { value: 'ALL',              label: 'Toutes les demandes' },
    { value: 'PENDING',          label: 'PENDING' },
    { value: 'PENDING_REVIEW',   label: 'PENDING_REVIEW' },
    { value: 'REVIEW_APPROVED',  label: 'REVIEW_APPROVED' },
    { value: 'CSR_SUBMITTED',    label: 'CSR_SUBMITTED' },
    { value: 'NEEDS_CORRECTION', label: 'NEEDS_CORRECTION' },
    { value: 'ISSUED',           label: 'ISSUED' },
    { value: 'REJECTED',         label: 'REJECTED' },
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

  useEffect(() => { setPage(1); load(); }, [statusFilter, pageSize]);
  useEffect(() => { load(); }, [page]);

  const totalPages  = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
            <h1 className="text-2xl font-bold text-white">Demandes de certificats</h1>
            <p className="mt-0.5 text-sm text-white/60">
              Analysez les dossiers entrants, appliquez les statuts et accédez aux détails en un clic.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Total</div>
              <div className="text-xl font-bold text-white">{total}</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Page</div>
              <div className="text-xl font-bold text-white">{currentPage} / {totalPages}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="pki-card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Filter size={12} /> Filtrer
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pki-input py-1.5 text-sm"
              style={{ width: 'auto', minWidth: '180px' }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {statusFilter !== 'ALL' && (
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                {total} résultat(s)
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              Affichage :
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="pki-input py-1 text-sm"
                style={{ width: '70px' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                ← Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                Suivant →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="pki-card flex items-center justify-center p-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="pki-card overflow-hidden hidden md:block">
            <table className="pki-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Utilisateur</th>
                  <th>Common Name</th>
                  <th>Statut</th>
                  <th>Soumis le</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {r.id.slice(0, 8)}…
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-medium">{r.userEmail || r.userId}</span>
                    </td>
                    <td>
                      <span className="font-semibold">{r.commonName || '—'}</span>
                    </td>
                    <td>
                      <span className={getStatusClass(r.status)}>{r.status}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString('fr-FR') : '—'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/admin/requests/${r.id}`)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        Voir <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                      Aucune demande trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {requests.map((r) => (
              <div key={r.id} className="pki-card p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {r.commonName || 'Demande'}
                  </p>
                  <span className={getStatusClass(r.status)}>{r.status}</span>
                </div>
                <p className="font-mono text-xs text-slate-400">{r.id}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.userEmail || r.userId}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {r.submittedAt ? new Date(r.submittedAt).toLocaleString('fr-FR') : '—'}
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => navigate(`/admin/requests/${r.id}`)}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    Voir le dossier <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="pki-card p-8 text-center text-sm text-slate-400">
                Aucune demande trouvée.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function getStatusClass(status?: string): string {
  const value = (status || 'INCONNU').toUpperCase();
  switch (value) {
    case 'PENDING':
    case 'PENDING_REVIEW':      return 'status-badge status-pending';
    case 'ISSUED':              return 'status-badge status-active';
    case 'REJECTED':            return 'status-badge status-revoked';
    case 'NEEDS_CORRECTION':    return 'status-badge status-rejected';
    case 'REVIEW_APPROVED':
    case 'CSR_SUBMITTED':       return 'status-badge status-pending';
    default:                    return 'status-badge status-pending';
  }
}
