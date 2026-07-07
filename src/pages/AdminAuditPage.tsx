import { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/api';
import {
  Activity, Search, Trash2, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, AlertCircle, FileText, Calendar,
} from 'lucide-react';

type SortDir = 'asc' | 'desc' | null;
type SortKey = 'action' | 'user' | 'entity' | 'date';

const ACTION_OPTIONS = [
  'ALL', 'USER_LOGIN', 'USER_REGISTER', 'REQUEST_SUBMITTED', 'REQUEST_UPDATED',
  'CSR_SUBMITTED', 'CSR_APPROVED', 'CSR_REJECTED', 'TOKEN_VALIDATED',
  'CERTIFICATE_ISSUED', 'CERTIFICATE_REVOKED', 'CRL_PUBLISHED',
  'CERTIFICATE_EXPIRING_SOON', 'CERTIFICATE_RENEWED',
];

function actionBadgeCls(action: string): string {
  if (action.includes('REVOKED') || action.includes('REJECTED'))
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
  if (action.includes('ISSUED') || action.includes('APPROVED') || action.includes('PUBLISHED'))
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (action.includes('LOGIN') || action.includes('REGISTER'))
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  if (action.includes('EXPIRING') || action.includes('RENEWED'))
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

const AVATAR_PALETTE = ['#065f46','#1d4ed8','#7c3aed','#dc2626','#d97706','#0369a1','#0f766e'];
function avatarColor(str?: string): string {
  if (!str) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
function initials(email?: string): string {
  if (!email) return 'SY';
  const parts = email.split('@')[0].split(/[._-]/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '');
}

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc')  return <ChevronUp   size={12} className="text-emerald-500" />;
  if (dir === 'desc') return <ChevronDown size={12} className="text-emerald-500" />;
  return <ChevronsUpDown size={12} className="text-slate-300 dark:text-slate-600" />;
}

function fmtDate(raw?: string | null): string {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return raw; }
}

const COLS: { key: SortKey; label: string }[] = [
  { key: 'action', label: 'Action' },
  { key: 'user',   label: 'Utilisateur' },
  { key: 'entity', label: 'Entité' },
  { key: 'date',   label: 'Date' },
];

export default function AdminAuditPage() {
  const [allItems, setAllItems]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Filters
  const [search, setSearch]       = useState('');
  const [actionFilter, setAction] = useState('ALL');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');

  // Table state
  const [pageSize, setPageSize]   = useState(10);
  const [page, setPage]           = useState(1);
  const [sortKey, setSortKey]     = useState<SortKey>('date');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAuditLogs(
        actionFilter === 'ALL' ? undefined : actionFilter,
        0, 1000,
      );
      setAllItems(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); load(); }, [actionFilter]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await adminService.deleteAuditLog(id);
      setAllItems((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError('Impossible de supprimer ce log.');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = allItems;

    // Text search
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((l) =>
        (l.action        || '').toLowerCase().includes(q) ||
        (l.userEmail     || '').toLowerCase().includes(q) ||
        (l.entityType    || '').toLowerCase().includes(q) ||
        (l.entityId      || '').toLowerCase().includes(q) ||
        (l.id            || '').toLowerCase().includes(q),
      );
    }

    // Date from
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((l) => l.createdAt && new Date(l.createdAt).getTime() >= from);
    }

    // Date to
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59').getTime();
      list = list.filter((l) => l.createdAt && new Date(l.createdAt).getTime() <= to);
    }

    return list;
  }, [allItems, search, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    if (!sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case 'action': av = a.action;      bv = b.action;      break;
        case 'user':   av = a.userEmail;   bv = b.userEmail;   break;
        case 'entity': av = a.entityType;  bv = b.entityType;  break;
        case 'date':   av = a.createdAt;   bv = b.createdAt;   break;
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
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Activity size={22} /> Journal d'audit
            </h1>
            <p className="mt-0.5 text-sm text-white/60">Historique complet des actions sensibles</p>
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

      {/* Confirm delete modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="pki-card mx-4 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <Trash2 size={18} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">Supprimer ce log ?</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deletingId === confirmId}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {deletingId === confirmId ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pki-card overflow-hidden">

        {/* ── Toolbar ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-700/60 px-5 py-4">
          {/* Row 1: show entries + action filter + search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Show entries */}
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

              {/* Action filter */}
              <select
                value={actionFilter}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a === 'ALL' ? 'Toutes les actions' : a}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-xs sm:w-64">
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

          {/* Row 2: date range filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
              <Calendar size={13} /> Période
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                  className="text-xs text-slate-400 hover:text-rose-500 transition"
                >
                  ✕ Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────────── */}
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
                  {COLS.map(({ key, label }) => (
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
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Détails
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <FileText size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">Aucun log trouvé.</p>
                    </td>
                  </tr>
                ) : pageItems.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 dark:border-slate-700/40 transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10"
                  >
                    {/* Action badge */}
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${actionBadgeCls(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* User */}
                    <td className="px-5 py-3">
                      {log.userEmail ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase text-white"
                            style={{ background: avatarColor(log.userEmail) }}
                          >
                            {initials(log.userEmail).toUpperCase()}
                          </div>
                          <span className="truncate text-xs text-slate-700 dark:text-slate-200 max-w-[160px]">
                            {log.userEmail}
                          </span>
                        </div>
                      ) : (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          SYSTEM
                        </span>
                      )}
                    </td>

                    {/* Entity */}
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {log.entityType || '—'}
                        {log.entityId && (
                          <span className="ml-1 font-mono text-[10px] text-slate-400">
                            {String(log.entityId).slice(0, 8)}…
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(log.createdAt)}</span>
                    </td>

                    {/* Details (collapsible) */}
                    <td className="px-5 py-3 max-w-[200px]">
                      {log.details ? (
                        <details className="group">
                          <summary className="cursor-pointer text-xs text-slateald-400 hover:text-emerald-600 dark:hover:text-emerald-400 select-none list-none">
                            <span className="underline decoration-dotted">Voir</span>
                          </summary>
                          <pre className="mt-1 overflow-auto rounded-lg bg-slate-100 dark:bg-slate-800 p-1.5 text-[10px] text-slate-600 dark:text-slate-300 max-h-32">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setConfirmId(log.id)}
                          disabled={deletingId === log.id}
                          title="Supprimer ce log"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer: info + pagination ─────────────────────── */}
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
