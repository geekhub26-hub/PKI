import { useEffect, useState } from 'react';
import {
  ClipboardList, TrendingUp, CheckCircle, Clock,
  XCircle, AlertCircle, RefreshCw, BarChart2, Download,
} from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';

interface Stats {
  total: number;
  parStatut: Record<string, number>;
  tauxRegen: number;
  totalCeMois: number;
  totalAujourdhui: number;
  volumesMois: { mois: string; count: number }[];
}

function authHeader() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

const STATUT_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  VALIDE:   { label: 'Valides',   color: 'text-emerald-600 dark:text-emerald-400', icon: <CheckCircle size={20} /> },
  EXPIRE:   { label: 'Expirés',   color: 'text-amber-500 dark:text-amber-400',     icon: <Clock size={20} /> },
  ANNULE:   { label: 'Annulés',   color: 'text-rose-600 dark:text-rose-400',       icon: <XCircle size={20} /> },
  REMPLACE: { label: 'Remplacés', color: 'text-neutral-500 dark:text-neutral-400', icon: <AlertCircle size={20} /> },
};

function fmt(iso: string) {
  const [y, m] = iso.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1);
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

export default function AdminRecepisseStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const r = await fetch(`${API_BASE}/admin/recepisses/export`, { headers: authHeader() });
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recepisses.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Échec de l\'export.');
    } finally {
      setExporting(false);
    }
  };

  const load = () => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/admin/recepisses/stats`, { headers: authHeader() })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setStats)
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <div className="py-16 text-center text-neutral-500">Chargement...</div>;
  if (error || !stats) return (
    <div className="py-16 text-center text-rose-500">{error}</div>
  );

  const maxVol = Math.max(...stats.volumesMois.map((v) => v.count), 1);

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_55%)]" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <ClipboardList size={12} /> Récépissés
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Statistiques récépissés</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <Download size={14} /> {exporting ? 'Export...' : 'Exporter CSV'}
            </button>
            <button
              onClick={load}
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <RefreshCw size={14} /> Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(STATUT_CFG).map(([key, cfg]) => (
          <div key={key} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className={`mb-2 ${cfg.color}`}>{cfg.icon}</div>
            <div className={`text-2xl font-bold ${cfg.color}`}>
              {stats.parStatut[key] ?? 0}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Total tous statuts</div>
          <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Ce mois-ci</div>
          <div className="text-3xl font-bold text-sky-600 dark:text-sky-400">{stats.totalCeMois}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            <TrendingUp size={12} /> Taux de régénération
          </div>
          <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">{stats.tauxRegen}%</div>
          <div className="mt-1 text-xs text-neutral-400">Remplacés / (Remplacés + Expirés)</div>
        </div>
      </div>

      {/* Volume par mois — bar chart CSS */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          <BarChart2 size={16} /> Volume mensuel (6 derniers mois)
        </div>
        <div className="flex items-end gap-3">
          {stats.volumesMois.map((v) => {
            const h = maxVol > 0 ? Math.max(8, Math.round((v.count / maxVol) * 140)) : 8;
            return (
              <div key={v.mois} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{v.count}</span>
                <div
                  className="w-full rounded-lg bg-sky-500/80 dark:bg-sky-600/80"
                  style={{ height: `${h}px` }}
                />
                <span className="text-[10px] text-neutral-400">{fmt(v.mois)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
