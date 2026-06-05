import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
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
      const res = await adminService.getCertificateRequests(statusFilter === 'ALL' ? undefined : statusFilter, page - 1, pageSize);
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
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.12),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              Console d'instruction
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Demandes de certificats</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              Analysez les dossiers entrants, appliquez les statuts et accedez aux demandes en un clic.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Total demandes</div>
              <div className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{total}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Page</div>
              <div className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {currentPage} / {totalPages}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Filtre statut</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:ring-primary-900"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {total} resultat(s)
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-neutral-600 dark:text-neutral-400">Affichage</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:ring-primary-900"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <div className="flex items-center gap-2">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Prec
            </Button>
            <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Suiv
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          Chargement...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="hidden overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
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
                {requests.map((r) => {
                  const meta = getStatusMeta(r.status);
                  return (
                    <tr key={r.id} className="border-t border-neutral-200 dark:border-neutral-800">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-200">{r.id}</td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-200">{r.userEmail || r.userId}</td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-200">{r.commonName || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 dark:text-neutral-300">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Button onClick={() => navigate(`/admin/requests/${r.id}`)}>Voir</Button>
                      </td>
                    </tr>
                  );
                })}

                {requests.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-neutral-500 dark:text-neutral-300" colSpan={6}>
                      Aucune demande trouvee.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:hidden">
            {requests.map((r) => {
              const meta = getStatusMeta(r.status);
              return (
                <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{r.commonName || 'Demande'}</div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{r.id}</div>
                  <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">{r.userEmail || r.userId}</div>
                  <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}
                  </div>
                  <div className="mt-3">
                    <Button onClick={() => navigate(`/admin/requests/${r.id}`)}>Voir</Button>
                  </div>
                </div>
              );
            })}

            {requests.length === 0 && (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
                Aucune demande trouvee.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusMeta(status?: string) {
  const value = (status || 'INCONNU').toUpperCase();
  switch (value) {
    case 'PENDING':
    case 'PENDING_REVIEW':
      return {
        label: value,
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      };
    case 'REVIEW_APPROVED':
    case 'CSR_SUBMITTED':
      return {
        label: value,
        className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
      };
    case 'NEEDS_CORRECTION':
      return {
        label: value,
        className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
      };
    case 'ISSUED':
      return {
        label: value,
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
      };
    case 'REJECTED':
      return {
        label: value,
        className: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
      };
    default:
      return {
        label: value,
        className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
      };
  }
}
