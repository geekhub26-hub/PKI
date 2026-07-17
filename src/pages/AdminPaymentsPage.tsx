import { useCallback, useEffect, useState } from 'react';
import {
  CreditCard, RefreshCw, CheckCircle, Clock, Search,
  AlertTriangle, ChevronRight, User,
} from 'lucide-react';
import { adminService, paymentService } from '../services/api';

interface PaymentRow {
  requestId: string;
  status: string;
  sharePayReference: string;
  paymentInitiatedAt: string;
  amount: string;
  commonName: string;
  userId: string;
  userName: string;
  userEmail: string;
}

type Filter = 'ALL' | 'AWAITING_PAYMENT' | 'PAYMENT_CONFIRMED';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  AWAITING_PAYMENT:  { label: 'En attente',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  PAYMENT_CONFIRMED: { label: 'Confirmé',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

function fmtDate(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtAmount(s: string) {
  const n = parseInt(s, 10);
  if (isNaN(n)) return s + ' FCFA';
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export default function AdminPaymentsPage() {
  const [rows, setRows]           = useState<PaymentRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState<Filter>('ALL');
  const [search, setSearch]       = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [verifying, setVerifying]   = useState<string | null>(null);
  const [actionMsg, setActionMsg]   = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminService.getPayments()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => setError(e?.message || 'Impossible de charger les paiements.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = rows.filter((r) => {
    if (filter !== 'ALL' && r.status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.commonName.toLowerCase().includes(q) ||
      r.sharePayReference.toLowerCase().includes(q) ||
      r.requestId.toLowerCase().includes(q)
    );
  });

  const totals = {
    all:       rows.length,
    awaiting:  rows.filter((r) => r.status === 'AWAITING_PAYMENT').length,
    confirmed: rows.filter((r) => r.status === 'PAYMENT_CONFIRMED').length,
  };

  async function handleConfirm(requestId: string) {
    setConfirming(requestId);
    setActionMsg(null);
    try {
      const res = await adminService.confirmPayment(requestId);
      setActionMsg({ id: requestId, msg: res.message || 'Confirmé.', ok: true });
      load();
    } catch (e: any) {
      setActionMsg({ id: requestId, msg: e?.message || 'Erreur lors de la confirmation.', ok: false });
    } finally {
      setConfirming(null);
    }
  }

  async function handleVerify(requestId: string) {
    setVerifying(requestId);
    setActionMsg(null);
    try {
      const res = await paymentService.verifyPayment(requestId);
      setActionMsg({ id: requestId, msg: res.message || 'Vérifié.', ok: true });
      load();
    } catch (e: any) {
      setActionMsg({ id: requestId, msg: e?.message || 'Erreur lors de la vérification.', ok: false });
    } finally {
      setVerifying(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">

      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <CreditCard size={22} className="text-white" />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-white/50">Administration</p>
              <h1 className="text-2xl font-bold text-white">Paiements</h1>
              <p className="mt-0.5 text-sm text-white/60">Suivi des paiements SharePay</p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition">
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total paiements initiés', value: totals.all,       icon: CreditCard, cls: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'En attente de paiement',  value: totals.awaiting,  icon: Clock,      cls: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Paiements confirmés',      value: totals.confirmed, icon: CheckCircle,cls: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(({ label, value, icon: Icon, cls, bg }) => (
          <div key={label} className="pki-card p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon size={18} className={cls} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{loading ? '…' : value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="pki-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {(['ALL', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {f === 'ALL' ? `Tous (${totals.all})` : f === 'AWAITING_PAYMENT' ? `En attente (${totals.awaiting})` : `Confirmés (${totals.confirmed})`}
              </button>
            ))}
          </div>
          <div className="relative ml-auto flex-1 min-w-48 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, email, référence…)"
              className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="pki-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucun paiement trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40">
                <tr>
                  {['Utilisateur', 'Demande (CN)', 'Référence SharePay', 'Montant', 'Date initiation', 'Statut', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {visible.map((row) => {
                  const statusMeta = STATUS_LABELS[row.status] ?? { label: row.status, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
                  const isAwaiting = row.status === 'AWAITING_PAYMENT';
                  const isConfirming = confirming === row.requestId;
                  const isVerifying  = verifying  === row.requestId;
                  const msg = actionMsg?.id === row.requestId ? actionMsg : null;
                  return (
                    <tr key={row.requestId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                            <User size={12} className="text-slate-500 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white leading-tight">{row.userName || '—'}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.userEmail || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-white">{row.commonName || '—'}</p>
                        <p className="text-[11px] font-mono text-slate-400">{row.requestId.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3">
                        {row.sharePayReference ? (
                          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all">{row.sharePayReference}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                        {fmtAmount(row.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {fmtDate(row.paymentInitiatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${statusMeta.cls}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          {isAwaiting && (
                            <>
                              <button
                                disabled={isConfirming || isVerifying}
                                onClick={() => handleConfirm(row.requestId)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition whitespace-nowrap"
                              >
                                <CheckCircle size={12} />
                                {isConfirming ? 'Confirmation…' : 'Confirmer'}
                              </button>
                              <button
                                disabled={isConfirming || isVerifying || !row.sharePayReference}
                                onClick={() => handleVerify(row.requestId)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 dark:border-blue-600 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 transition whitespace-nowrap"
                              >
                                <RefreshCw size={12} />
                                {isVerifying ? 'Vérification…' : 'Vérifier SharePay'}
                              </button>
                            </>
                          )}
                          <a
                            href={`/#/admin/requests/${row.requestId}`}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition"
                          >
                            <ChevronRight size={11} /> Voir la demande
                          </a>
                          {msg && (
                            <p className={`text-xs font-medium ${msg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {msg.msg}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
