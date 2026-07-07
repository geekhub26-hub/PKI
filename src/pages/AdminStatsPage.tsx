import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import {
  AreaChart, Area,
  LineChart, Line,
  Bar,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp, Users, FileCheck2, ShieldCheck,
  AlertTriangle, CheckCircle2, XCircle, Clock3,
  BarChart3, Activity,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildMonthSeries(items: any[], dateField: string, months = 6) {
  const map: Record<string, number> = {};
  const now = new Date();
  const labels: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    map[key] = 0;
    labels.push(key);
  }
  items.forEach((item) => {
    const raw = item[dateField];
    if (!raw) return;
    const key = new Date(raw).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    if (key in map) map[key]++;
  });
  return labels.map((name) => ({ name, value: map[name] }));
}

function mergeSeries(
  a: { name: string; value: number }[],
  b: { name: string; value: number }[],
  keyA: string,
  keyB: string,
) {
  return a.map((item, i) => ({
    name:     item.name,
    [keyA]:   item.value,
    [keyB]:   b[i]?.value ?? 0,
  }));
}

function pct(num: number, den: number) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-600 dark:text-slate-300">{p.name} :</span>
          <span className="font-bold text-slate-800 dark:text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Metric tile ───────────────────────────────────────────────────────────────
function MetricTile({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="pki-card p-5 flex items-start gap-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: color + '20' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
        <div className="mt-0.5 text-xs text-slate-400">{sub}</div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminStatsPage() {
  const [dash,   setDash]    = useState<any>(null);
  const [sys,    setSys]     = useState<any>(null);
  const [certs,  setCerts]   = useState<any[]>([]);
  const [reqs,   setReqs]    = useState<any[]>([]);
  const [audits, setAudits]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getDashboard(),
      adminService.getSystemStats(),
      adminService.getCertificates(undefined, 0, 500),
      adminService.getCertificateRequests(undefined, 0, 500),
      adminService.getAuditLogs(undefined, 0, 200),
    ])
      .then(([d, s, c, r, a]) => {
        setDash(d);
        setSys(s);
        setCerts(c.items ?? []);
        setReqs(r.items ?? []);
        setAudits(a.items ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
        <p className="text-sm text-slate-400">Chargement des statistiques…</p>
      </div>
    );
  }

  // ── Computed values ───────────────────────────────────────────────────────
  const totalCerts  = (dash?.activeCertificates ?? 0) + (dash?.revokedCertificates ?? 0);
  const totalReqs   = sys?.certificateRequests ?? 0;
  const revokeRate  = pct(dash?.revokedCertificates ?? 0, totalCerts);
  const pendingRate = pct(dash?.pendingRequests     ?? 0, totalReqs);
  const expDays     = dash?.caStatus?.daysUntilExpiration;

  // ── Time series (6 months) ────────────────────────────────────────────────
  const certSeries  = buildMonthSeries(certs,  'issuedAt',    6);
  const reqSeries   = buildMonthSeries(reqs,   'submittedAt', 6);
  const auditSeries = buildMonthSeries(audits, 'createdAt',   6);

  const trendData = mergeSeries(certSeries, reqSeries, 'Certificats émis', 'Demandes');
  const auditData = auditSeries.map((x) => ({ ...x, Activité: x.value }));

  // ── Pie data ──────────────────────────────────────────────────────────────
  const certPie = [
    { name: 'Actifs',   value: dash?.activeCertificates  ?? 0 },
    { name: 'Révoqués', value: dash?.revokedCertificates ?? 0 },
  ];
  const PIE_COLORS = ['#059669', '#EF4444'];

  // ── Radar data ────────────────────────────────────────────────────────────
  const maxForRadar = Math.max(
    dash?.totalUsers         ?? 0,
    totalReqs,
    sys?.certificates        ?? 0,
    100,
  ) || 1;
  const normalize = (v: number) => Math.round((v / maxForRadar) * 100);

  const radarData = [
    { subject: 'Utilisateurs', A: normalize(dash?.totalUsers ?? 0) },
    { subject: 'Demandes',     A: normalize(totalReqs) },
    { subject: 'Certificats',  A: normalize(sys?.certificates ?? 0) },
    { subject: 'Révocations',  A: revokeRate },
    { subject: 'En attente',   A: pendingRate },
  ];

  // ── Monthly bar (combined) ────────────────────────────────────────────────
  const barData = trendData;

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Header */}
      <div className="page-header-bar flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Statistiques &amp; Analytique</h1>
          <p className="text-sm text-emerald-100/80">Évolution et répartition des données du système PKI</p>
        </div>
      </div>

      {/* ── KPI tiles ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={<XCircle size={20} />}
          label="Taux de révocation"
          value={`${revokeRate}%`}
          sub={`${dash?.revokedCertificates ?? 0} / ${totalCerts} certificats`}
          color="#EF4444"
        />
        <MetricTile
          icon={<Clock3 size={20} />}
          label="Demandes en attente"
          value={`${pendingRate}%`}
          sub={`${dash?.pendingRequests ?? 0} / ${totalReqs} demandes`}
          color="#F59E0B"
        />
        <MetricTile
          icon={<TrendingUp size={20} />}
          label="Certificats émis"
          value={String(sys?.certificates ?? 0)}
          sub={`${dash?.activeCertificates ?? 0} actifs actuellement`}
          color="#059669"
        />
        <MetricTile
          icon={expDays !== undefined && expDays < 90 ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
          label="Validité AC"
          value={expDays !== undefined ? `${expDays}j` : '—'}
          sub={expDays === undefined ? 'AC non initialisée'
            : expDays < 30 ? 'Renouvellement urgent !'
            : expDays < 90 ? 'Renouvellement proche'
            : 'AC en bonne santé'}
          color={expDays === undefined ? '#94A3B8' : expDays < 30 ? '#EF4444' : expDays < 90 ? '#F59E0B' : '#059669'}
        />
      </div>

      {/* ── Area chart — tendance sur 6 mois ───────────────────────────────── */}
      <div className="pki-card p-6">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tendance sur 6 mois</h3>
        </div>
        <p className="mb-5 text-xs text-slate-400">Évolution des certificats émis et des demandes soumises</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCerts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradReqs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={9} />
              <Area
                type="monotone"
                dataKey="Certificats émis"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#gradCerts)"
                dot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="Demandes"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fill="url(#gradReqs)"
                dot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Line chart + Radar ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Line chart — activité audit */}
        <div className="pki-card p-6">
          <div className="mb-1 flex items-center gap-2">
            <Activity size={15} className="text-blue-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Activité du système</h3>
          </div>
          <p className="mb-5 text-xs text-slate-400">Nombre d'actions tracées par mois (journal d'audit)</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={auditData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="Activité"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar — santé du système */}
        <div className="pki-card p-6">
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck size={15} className="text-purple-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Santé du système</h3>
          </div>
          <p className="mb-5 text-xs text-slate-400">Répartition relative des indicateurs clés (valeurs normalisées)</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Système"
                  dataKey="A"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  fill="#7C3AED"
                  fillOpacity={0.18}
                  dot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }}
                />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bar chart mensuel + Pie ─────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Composed bar + line — comparaison mensuelle */}
        <div className="pki-card p-6 lg:col-span-2">
          <div className="mb-1 flex items-center gap-2">
            <BarChart3 size={15} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Comparaison mensuelle</h3>
          </div>
          <p className="mb-5 text-xs text-slate-400">Barres = demandes soumises · Courbe = certificats émis</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={9} />
                <Bar dataKey="Demandes" fill="#FCD34D" radius={[5, 5, 0, 0]} fillOpacity={0.9} />
                <Line
                  type="monotone"
                  dataKey="Certificats émis"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut — statut certificats */}
        <div className="pki-card p-6">
          <div className="mb-1 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Statut certificats</h3>
          </div>
          <p className="mb-3 text-xs text-slate-400">{totalCerts} au total</p>
          {totalCerts === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-slate-400">Aucun certificat émis</div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={certPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {certPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {certPie.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {item.value} <span className="font-normal text-slate-400">({pct(item.value, totalCerts)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Résumé chiffré ──────────────────────────────────────────────────── */}
      <div className="pki-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileCheck2 size={15} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Résumé chiffré</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: <Users size={14} />,       label: 'Utilisateurs',         value: dash?.totalUsers          ?? 0, color: '#3B82F6' },
            { icon: <FileCheck2 size={14} />,   label: 'Demandes totales',     value: totalReqs,                      color: '#F59E0B' },
            { icon: <CheckCircle2 size={14} />, label: 'Certificats émis',     value: sys?.certificates         ?? 0, color: '#059669' },
            { icon: <Clock3 size={14} />,       label: 'En attente',           value: dash?.pendingRequests     ?? 0, color: '#F59E0B' },
            { icon: <XCircle size={14} />,      label: 'Révoqués',             value: dash?.revokedCertificates ?? 0, color: '#EF4444' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="flex flex-col items-center rounded-xl border border-slate-100 dark:border-slate-700/50 py-4 px-3 text-center">
              <span className="mb-1" style={{ color }}>{icon}</span>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
              <div className="mt-0.5 text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
