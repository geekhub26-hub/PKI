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

const STATUT_CFG: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  VALIDE:   { label: 'Valides',   badgeClass: 'status-badge status-active',  icon: <CheckCircle size={18} /> },
  EXPIRE:   { label: 'Expirés',   badgeClass: 'status-badge status-pending', icon: <Clock size={18} /> },
  ANNULE:   { label: 'Annulés',   badgeClass: 'status-badge status-rejected',icon: <XCircle size={18} /> },
  REMPLACE: { label: 'Remplacés', badgeClass: 'status-badge status-revoked', icon: <AlertCircle size={18} /> },
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
      alert("Échec de l'export.");
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

  if (loading) return <div className="py-16 text-center text-slate-500 dark:text-slate-400">Chargement...</div>;
  if (error || !stats) return <div className="py-16 text-center text-rose-500">{error}</div>;

  const maxVol = Math.max(...stats.volumesMois.map((v) => v.count), 1);

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList size={24} /> Statistiques récépissés
            </h1>
            <p className="mt-1 text-sm text-white/70">Vue d'ensemble des récépissés de la plateforme</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="btn btn-green"
              style={{ padding: '7px 14px', fontSize: '13px' }}
            >
              <Download size={14} /> {exporting ? 'Export...' : 'Exporter CSV'}
            </button>
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition"
            >
              <RefreshCw size={14} /> Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* KPI par statut */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(STATUT_CFG).map(([key, cfg]) => (
          <div key={key} className="pki-card p-5">
            <div className="mb-2 text-slate-400">{cfg.icon}</div>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.parStatut[key] ?? 0}
            </p>
            <span className={`mt-2 ${cfg.badgeClass}`}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Métriques globales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card blue p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total tous statuts</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="stat-card green p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ce mois-ci</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.totalCeMois}</p>
        </div>
        <div className="pki-card p-5" style={{ borderTop: '3px solid #8B5CF6' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
            <TrendingUp size={11} /> Taux régénération
          </p>
          <p className="text-3xl font-extrabold text-violet-600 dark:text-violet-400">{stats.tauxRegen}%</p>
          <p className="mt-1 text-[11px] text-slate-400">Remplacés / (Remplacés + Expirés)</p>
        </div>
      </div>

      {/* Volume mensuel */}
      <div className="pki-card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <BarChart2 size={16} className="text-blue-500" />
          Volume mensuel (6 derniers mois)
        </div>
        <div className="flex items-end gap-3">
          {stats.volumesMois.map((v) => {
            const h = maxVol > 0 ? Math.max(8, Math.round((v.count / maxVol) * 140)) : 8;
            return (
              <div key={v.mois} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{v.count}</span>
                <div
                  className="w-full rounded-lg bg-blue-500/70 dark:bg-blue-600/70 transition-all"
                  style={{ height: `${h}px` }}
                />
                <span className="text-[10px] text-slate-400">{fmt(v.mois)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
