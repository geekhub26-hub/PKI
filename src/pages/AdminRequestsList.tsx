import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Search, Eye, ChevronLeft, ChevronRight, FileText, AlertCircle,
} from 'lucide-react';

type SortDir = 'asc' | 'desc' | null;
type SortKey = 'id' | 'user' | 'commonName' | 'status' | 'submittedAt';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:           { label: 'En attente',      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  PENDING_REVIEW:    { label: 'En révision',     cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  REVIEW_APPROVED:   { label: 'Approuvée',       cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  CSR_SUBMITTED:     { label: 'CSR soumis',      cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  NEEDS_CORRECTION:  { label: 'Correction req.', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  ISSUED:            { label: 'Émis',            cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  REJECTED:          { label: 'Rejeté',          cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

function getStatusCfg(status?: string) {
  return STATUS_CONFIG[(status ?? '').toUpperCase()] ?? { label: status || '—', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
}

const AVATAR_PALETTE = [
  '#065f46','#1d4ed8','#7c3aed','#dc2626','#d97706',
  '#0369a1','#0f766e','#be185d','#4338ca',
];

function avatarColor(str?: string): string {
  if (!str) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function getInitials(email?: string, firstName?: string, lastName?: string) {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (firstName)             return firstName.slice(0, 2).toUpperCase();
  if (email)                 return email.slice(0, 2).toUpperCase();
  return '??';
}

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc')  return <ChevronUp   size={12} className="text-emerald-500" />;
  if (dir === 'desc') return <ChevronDown size={12} className="text-emerald-500" />;
  return <ChevronsUpDown size={12} className="text-slate-300 dark:text-slate-600" />;
}

const STATUS_OPTIONS = [
  { value: 'ALL',             label: 'Tous les statuts' },
  { value: 'PENDING',         label: 'En attente' },
  { value: 'PENDING_REVIEW',  label: 'En révision' },
  { value: 'REVIEW_APPROVED', label: 'Approuvée' },
  { value: 'CSR_SUBMITTED',   label: 'CSR soumis' },
  { value: 'NEEDS_CORRECTION',label: 'Correction req.' },
  { value: 'ISSUED',          label: 'Émis' },
  { value: 'REJECTED',        label: 'Rejeté' },
];

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'id',          label: 'ID' },
  { key: 'user',        label: 'Utilisateur' },
  { key: 'commonName',  label: 'Common Name' },
  { key: 'status',      label: 'Statut' },
  { key: 'submittedAt', label: 'Soumis le' },
];

export default function AdminRequestsList() {
  const navigate = useNavigate();

  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [search, setSearch]         = useState('');
  const [pageSize, setPageSize]     = useState(10);
  const [page, setPage]             = useState(1);
  const [sortKey, setSortKey]       = useState<SortKey>('submittedAt');
  const [sortDir, setSortDir]       = useState<SortDir>('desc');
  const [statusFilter, setStatus]   = useState('ALL');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getCertificateRequests(
        statusFilter === 'ALL' ? undefined : statusFilter,
        0, 500,
      );
      setAllItems(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); load(); }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allItems;
    return allItems.filter((r) =>
      (r.commonName  || '').toLowerCase().includes(q) ||
      (r.userEmail   || '').toLowerCase().includes(q) ||
      (r.userFirstName || '').toLowerCase().includes(q) ||
      (r.userLastName  || '').toLowerCase().includes(q) ||
      (r.id          || '').toLowerCase().includes(q) ||
      (r.status      || '').toLowerCase().includes(q),
    );
  }, [allItems, search]);

  const sorted = useMemo(() => {
    if (!sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case 'id':          av = a.id;          bv = b.id;          break;
        case 'user':        av = a.userEmail;   bv = b.userEmail;   break;
        case 'commonName':  av = a.commonName;  bv = b.commonName;  break;
        case 'status':      av = a.status;      bv = b.status;      break;
        case 'submittedAt': av = a.submittedAt; bv = b.submittedAt; break;
      }
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start      = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end        = Math.min(safePage * pageSize, sorted.length);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const pageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">

      {/* Header */}
      <div className="page-header-bar">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
            <h1 className="text-2xl font-bold text-white">Demandes de certificats</h1>
            <p className="mt-0.5 text-sm text-white/60">
              Gérez les dossiers entrants, changez les statuts et accédez aux détails.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Total</div>
              <div className="text-xl font-bold text-white">{allItems.length}</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Filtrés</div>
              <div className="text-xl font-bold text-white">{sorted.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pki-card overflow-hidden">

        {/* ── Toolbar ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-700/60 px-5 py-4 md:flex-row md:items-center md:justify-between">
          {/* Left: page size + status filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="whitespace-nowrap">Afficher</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span className="whitespace-nowrap">entrées</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Right: search */}
          <div className="relative w-full max-w-xs md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher…"
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 px-5 py-8 text-sm text-rose-600 dark:text-rose-400">
            <AlertCircle size={16} className="flex-shrink-0" /> {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/50">
                  {COLUMNS.map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="cursor-pointer select-none whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 transition hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {label}
                        <SortIcon dir={sortKey === key ? sortDir : null} />
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <FileText size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">Aucune demande trouvée.</p>
                    </td>
                  </tr>
                ) : pageItems.map((r) => {
                  const status = getStatusCfg(r.status);
                  const color  = avatarColor(r.userEmail);
                  const init   = getInitials(r.userEmail, r.userFirstName, r.userLastName);
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 dark:border-slate-700/40 transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10"
                    >
                      {/* ID */}
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                          {r.id.slice(0, 8)}…
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                            style={{ background: color }}
                          >
                            {init}
                          </div>
                          <div className="min-w-0">
                            {(r.userFirstName || r.userLastName) && (
                              <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                                {r.userFirstName} {r.userLastName}
                              </div>
                            )}
                            <div className="truncate text-xs text-slate-400 dark:text-slate-500">
                              {r.userEmail || r.userId || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Common Name */}
                      <td className="px-5 py-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {r.commonName || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {r.submittedAt
                            ? new Date(r.submittedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                            : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => navigate(`/admin/requests/${r.id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                          >
                            <Eye size={12} /> Voir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer: info + pagination ────────────────────── */}
        {!loading && !error && (
          <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-700/60 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {sorted.length === 0
                ? 'Aucun résultat'
                : `Affichage de ${start} à ${end} sur ${sorted.length} entrée${sorted.length > 1 ? 's' : ''}`}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>

              {pageNumbers().map((n, i) =>
                n === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-slate-400">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-1 text-xs font-semibold transition ${
                      n === safePage
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
