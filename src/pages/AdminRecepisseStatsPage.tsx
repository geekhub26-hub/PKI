import { useEffect, useState } from 'react';
import {
  ClipboardList, TrendingUp, CheckCircle, Clock,
  XCircle, RefreshCw, BarChart2, Download, AlertCircle,
  Filter, Building2, Medal,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';

interface Stats {
  total: number;
  parStatut: Record<string, number>;
  tauxRegen: number;
  totalCeMois: number;
  totalAujourdhui: number;
  volumesMois: { mois: string; count: number }[];
  top5Entites: { entiteId: string; nom: string; count: number }[];
}

interface Entite { id: string; nom: string; code: string; type: string; }

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

const STATUTS = ['ALL', 'VALIDE', 'EXPIRE', 'ANNULE', 'REMPLACE'];
const STATUT_LABELS: Record<string, string> = {
  ALL: 'Tous les statuts', VALIDE: 'Valide', EXPIRE: 'Expiré', ANNULE: 'Annulé', REMPLACE: 'Remplacé',
};

function fmt(iso: string) {
  const [y, m] = iso.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1);
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#92400E', '#3B82F6', '#6366F1'];

export default function AdminRecepisseStatsPage() {
  const user = useAuthStore((s) => s.user);
  const isScoped = user?.role === 'AEL' || user?.role === 'ADMIN_AEL';
  const canFilterEntite = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [exporting, setExporting]     = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [entites, setEntites]     = useState<Entite[]>([]);

  const [dateDebut, setDateDebut]   = useState('');
  const [dateFin, setDateFin]       = useState('');
  const [statut, setStatut]         = useState('ALL');
  const [typeCertif, setTypeCertif] = useState('');
  const [entiteId, setEntiteId]     = useState('');

  useEffect(() => {
    if (!canFilterEntite) return;
    fetch(`${API_BASE}/admin/entites`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEntites)
      .catch(() => {});
  }, [canFilterEntite]);

  const buildQuery = () => {
    const p = new URLSearchParams();
    if (dateDebut) p.set('dateDebut', dateDebut);
    if (dateFin)   p.set('dateFin',   dateFin);
    if (statut && statut !== 'ALL') p.set('statut', statut);
    if (typeCertif.trim()) p.set('typeCertif', typeCertif.trim());
    if (entiteId && canFilterEntite) p.set('entiteId', entiteId);
    return p.toString();
  };

  const load = () => {
    setLoading(true);
    setError(null);
    const qs = buildQuery();
    fetch(`${API_BASE}/admin/recepisses/stats${qs ? '?' + qs : ''}`, { headers: authHeader() })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setStats)
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const resetFilters = () => {
    setDateDebut(''); setDateFin(''); setStatut('ALL'); setTypeCertif(''); setEntiteId('');
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const r = await fetch(`${API_BASE}/admin/recepisses/export`, { headers: authHeader() });
      if (!r.ok) throw new Error();
      downloadBlob(await r.blob(), 'recepisses.csv');
    } catch {
      alert("Échec de l'export CSV.");
    } finally {
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      const qs = buildQuery();
      const r  = await fetch(
        `${API_BASE}/admin/recepisses/stats/export/pdf${qs ? '?' + qs : ''}`,
        { headers: authHeader() }
      );
      if (!r.ok) throw new Error();
      downloadBlob(await r.blob(), 'stats-recepisses.pdf');
    } catch {
      alert("Échec de l'export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const hasFilters = dateDebut || dateFin || statut !== 'ALL' || typeCertif || entiteId;

  if (loading && !stats) {
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
  const maxTop = stats.top5Entites.length > 0
    ? Math.max(...stats.top5Entites.map((e) => Number(e.count)), 1) : 1;

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
            <p className="mt-0.5 text-sm text-white/60">
              {isScoped
                ? 'Vue des statistiques de votre entité'
                : "Vue d'ensemble des récépissés de la plateforme"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={exportPdf}
              disabled={exportingPdf}
              className="btn btn-primary"
              style={{ padding: '7px 14px', fontSize: '13px' }}
            >
              <Download size={14} /> {exportingPdf ? 'PDF...' : 'Exporter PDF'}
            </button>
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="btn btn-green"
              style={{ padding: '7px 14px', fontSize: '13px' }}
            >
              <Download size={14} /> {exporting ? 'CSV...' : 'Exporter CSV'}
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="pki-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Filter size={14} className="text-blue-500" />
          <span>Filtres</span>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-xs text-blue-500 hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUTS.map((s) => (
                <option key={s} value={s}>{STATUT_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Type certif.</label>
            <input
              type="text"
              value={typeCertif}
              onChange={(e) => setTypeCertif(e.target.value)}
              placeholder="ex: Qualifié"
              className="w-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {canFilterEntite && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Entité</label>
              <select
                value={entiteId}
                onChange={(e) => setEntiteId(e.target.value)}
                className="max-w-[200px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les entités</option>
                {entites.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col justify-end gap-1">
            <span className="invisible text-[11px]">x</span>
            <button
              onClick={load}
              disabled={loading}
              className="btn btn-primary disabled:opacity-60"
              style={{ padding: '7px 18px', fontSize: '13px' }}
            >
              {loading ? 'Chargement…' : 'Filtrer'}
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
            <div className="kpi-value">{stats.tauxRegen}%</div>
            <div className="kpi-label">Taux régénération</div>
          </div>
        </div>
      </div>

      {/* Volume mensuel + Top 5 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
              const h = Math.max(8, Math.round((v.count / maxVol) * 120));
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

        {/* Top 5 Entités */}
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <Medal size={15} className="text-amber-500" />
              <span>Top entités par volume</span>
            </div>
          </div>

          {stats.top5Entites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 size={28} className="mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-400">Aucune donnée d'entité disponible.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {stats.top5Entites.map((ent, i) => {
                const barW = Math.max(4, Math.round((Number(ent.count) / maxTop) * 100));
                return (
                  <div key={ent.entiteId} className="flex items-center gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: RANK_COLORS[i] ?? '#6B7280' }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                          {ent.nom}
                        </span>
                        <span className="shrink-0 tabular-nums text-xs font-bold text-slate-500 dark:text-slate-400">
                          {ent.count}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${barW}%`, backgroundColor: RANK_COLORS[i] ?? '#6B7280' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
