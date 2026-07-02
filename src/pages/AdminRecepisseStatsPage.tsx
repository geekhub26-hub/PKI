import { useEffect, useState } from 'react';
import {
  ClipboardList, TrendingUp, CheckCircle, Clock,
  XCircle, RefreshCw, BarChart2, Download, AlertCircle,
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

const STATUT_CFG: Record<string, { label: string; iconClass: string; kpiColor: string; icon: React.ReactNode }> = {
  VALIDE:   { label: 'Valides',   iconClass: 'kpi-icon green',  kpiColor: 'green',  icon: <CheckCircle size={22} /> },
  EXPIRE:   { label: 'Expirés',   iconClass: 'kpi-icon amber',  kpiColor: 'amber',  icon: <Clock size={22} /> },
  ANNULE:   { label: 'Annulés',   iconClass: 'kpi-icon red',    kpiColor: 'red',    icon: <XCircle size={22} /> },
  REMPLACE: { label: 'Remplacés', iconClass: 'kpi-icon purple', kpiColor: 'purple', icon: <AlertCircle size={22} /> },
};

function fmt(iso: string) {
  const [y, m] = iso.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1);
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

export default function AdminRecepisseStatsPage() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const r = await fetch(`${API_BASE}/admin/recepisses/export`, { headers: authHeader() });
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }
  if (error || !stats) {
    return <div className="py-16 text-center text-rose-500">{error}</div>;
  }

  const maxVol = Math.max(...stats.volumesMois.map((v) => v.count), 1);

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <ClipboardList size={22} /> Statistiques récépissés
            </h1>
            <p className="mt-0.5 text-sm text-white/60">Vue d'ensemble des récépissés de la plateforme</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <RefreshCw size={14} /> Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* KPI par statut */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(STATUT_CFG).map(([key, cfg]) => (
          <div key={key} className={`kpi-card ${cfg.kpiColor}`}>
            <div className={cfg.iconClass}>{cfg.icon}</div>
            <div className="kpi-body">
              <div className="kpi-value">{stats.parStatut[key] ?? 0}</div>
              <div className="kpi-label">{cfg.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Métriques globales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><BarChart2 size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-label">Total tous statuts</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><ClipboardList size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{stats.totalCeMois}</div>
            <div className="kpi-label">Ce mois-ci</div>
          </div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon purple"><TrendingUp size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value" style={{ color: '#7C3AED' }}>{stats.tauxRegen}%</div>
            <div className="kpi-label">Taux régénération</div>
          </div>
        </div>
      </div>

      {/* Volume mensuel */}
      <div className="pki-card p-6">
        <div className="section-title">
          <div className="flex items-center gap-2">
            <BarChart2 size={15} className="text-blue-500" />
            <span>Volume mensuel (6 derniers mois)</span>
          </div>
        </div>
        <div className="flex items-end gap-3 pt-2">
          {stats.volumesMois.map((v) => {
            const h = maxVol > 0 ? Math.max(8, Math.round((v.count / maxVol) * 140)) : 8;
            return (
              <div key={v.mois} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{v.count}</span>
                <div
                  className="w-full rounded-lg bg-blue-500/80 dark:bg-blue-600/80 transition-all"
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
