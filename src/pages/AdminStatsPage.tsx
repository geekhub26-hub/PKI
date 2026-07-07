import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  TrendingUp, Users, FileCheck2, ShieldCheck,
  AlertTriangle, CheckCircle2, XCircle, Clock3,
  BarChart3,
} from 'lucide-react';

type DashData = {
  totalUsers: number;
  pendingRequests: number;
  activeCertificates: number;
  revokedCertificates: number;
  caStatus: any;
};

type SysStats = {
  users: number;
  certificates: number;
  certificateRequests: number;
  activeCA: boolean;
};

function pct(num: number, den: number) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const p = pct(value, total);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-semibold text-slate-800 dark:text-white">
          {value} <span className="font-normal text-slate-400">({p}%)</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${p}%`, background: color }}
        />
      </div>
    </div>
  );
}

function MetricTile({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="card-surface rounded-2xl p-5 flex items-start gap-4">
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

export default function AdminStatsPage() {
  const [dash, setDash]   = useState<DashData | null>(null);
  const [sys,  setSys]    = useState<SysStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminService.getDashboard(), adminService.getSystemStats()])
      .then(([d, s]) => { setDash(d); setSys(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
      </div>
    );
  }

  const totalCerts   = (dash?.activeCertificates ?? 0) + (dash?.revokedCertificates ?? 0);
  const totalReqs    = sys?.certificateRequests ?? 0;
  const revokeRate   = pct(dash?.revokedCertificates ?? 0, totalCerts);
  const pendingRate  = pct(dash?.pendingRequests ?? 0, totalReqs);
  const approvalRate = 100 - pendingRate;
  const expDays      = dash?.caStatus?.daysUntilExpiration;

  // Pie — certificats par statut
  const certPie = [
    { name: 'Actifs',   value: dash?.activeCertificates   ?? 0 },
    { name: 'Révoqués', value: dash?.revokedCertificates  ?? 0 },
  ];
  const PIE_COLORS = ['#059669', '#EF4444'];

  // Pie — demandes par état
  const reqPie = [
    { name: 'En attente', value: dash?.pendingRequests      ?? 0 },
    { name: 'Émis',       value: dash?.activeCertificates   ?? 0 },
    { name: 'Révoqués',   value: dash?.revokedCertificates  ?? 0 },
  ];
  const REQ_COLORS = ['#F59E0B', '#059669', '#EF4444'];

  // Bar — vue globale
  const barData = [
    { name: 'Utilisateurs',     count: dash?.totalUsers          ?? 0, fill: '#3B82F6' },
    { name: 'Demandes totales', count: totalReqs,                      fill: '#F59E0B' },
    { name: 'Certificats émis', count: sys?.certificates         ?? 0, fill: '#059669' },
    { name: 'Révoqués',         count: dash?.revokedCertificates ?? 0, fill: '#EF4444' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Header */}
      <div className="page-header-bar flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Statistiques &amp; Analytique</h1>
          <p className="text-sm text-emerald-100/80">Vue analytique du système PKI Souverain</p>
        </div>
      </div>

      {/* Computed KPIs — focus on derived metrics, not raw counts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={<XCircle size={20} />}
          label="Taux de révocation"
          value={`${revokeRate}%`}
          sub={`${dash?.revokedCertificates ?? 0} sur ${totalCerts} certificats`}
          color="#EF4444"
        />
        <MetricTile
          icon={<Clock3 size={20} />}
          label="Demandes en attente"
          value={`${pendingRate}%`}
          sub={`${dash?.pendingRequests ?? 0} sur ${totalReqs} demandes totales`}
          color="#F59E0B"
        />
        <MetricTile
          icon={<TrendingUp size={20} />}
          label="Taux d'émission"
          value={`${approvalRate}%`}
          sub={`${sys?.certificates ?? 0} certificats émis au total`}
          color="#059669"
        />
        <MetricTile
          icon={expDays !== undefined && expDays < 90 ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
          label="Validité AC"
          value={expDays !== undefined ? `${expDays}j` : '—'}
          sub={expDays !== undefined
            ? expDays < 30 ? 'Renouvellement urgent' : expDays < 90 ? 'Renouvellement proche' : 'AC valide'
            : 'AC non initialisée'}
          color={expDays === undefined ? '#94A3B8' : expDays < 30 ? '#EF4444' : expDays < 90 ? '#F59E0B' : '#059669'}
        />
      </div>

      {/* Charts row 1 — deux pie charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface rounded-2xl p-6">
          <div className="mb-1 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Certificats par statut</h3>
          </div>
          <p className="mb-4 text-xs text-slate-400">{totalCerts} certificats au total</p>
          {totalCerts === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">Aucun certificat émis</div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={certPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                      {certPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v}`, '']} />
                    <Legend iconType="circle" iconSize={9} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                <StatBar label="Actifs"   value={dash?.activeCertificates  ?? 0} total={totalCerts} color="#059669" />
                <StatBar label="Révoqués" value={dash?.revokedCertificates ?? 0} total={totalCerts} color="#EF4444" />
              </div>
            </>
          )}
        </div>

        <div className="card-surface rounded-2xl p-6">
          <div className="mb-1 flex items-center gap-2">
            <FileCheck2 size={15} className="text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Demandes par état</h3>
          </div>
          <p className="mb-4 text-xs text-slate-400">{totalReqs} demandes enregistrées</p>
          {totalReqs === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">Aucune demande</div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reqPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                      {reqPie.map((_, i) => <Cell key={i} fill={REQ_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v}`, '']} />
                    <Legend iconType="circle" iconSize={9} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                <StatBar label="En attente" value={dash?.pendingRequests     ?? 0} total={totalReqs} color="#F59E0B" />
                <StatBar label="Émis"       value={dash?.activeCertificates  ?? 0} total={totalReqs} color="#059669" />
                <StatBar label="Révoqués"   value={dash?.revokedCertificates ?? 0} total={totalReqs} color="#EF4444" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bar chart — vue globale + summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface rounded-2xl p-6 lg:col-span-2">
          <div className="mb-1 flex items-center gap-2">
            <BarChart3 size={15} className="text-blue-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Vue d'ensemble système</h3>
          </div>
          <p className="mb-4 text-xs text-slate-400">Volumes globaux par catégorie</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Résumé chiffré */}
        <div className="card-surface rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users size={15} className="text-blue-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Résumé chiffré</h3>
          </div>
          <div className="space-y-4">
            {[
              { icon: <Users size={14} />,      label: 'Utilisateurs inscrits', value: dash?.totalUsers ?? 0,          color: '#3B82F6' },
              { icon: <FileCheck2 size={14} />,  label: 'Demandes totales',     value: totalReqs,                      color: '#F59E0B' },
              { icon: <CheckCircle2 size={14} />,label: 'Certificats émis',     value: sys?.certificates ?? 0,         color: '#059669' },
              { icon: <Clock3 size={14} />,      label: 'En attente traitement',value: dash?.pendingRequests ?? 0,     color: '#F59E0B' },
              { icon: <XCircle size={14} />,     label: 'Certificats révoqués', value: dash?.revokedCertificates ?? 0, color: '#EF4444' },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span style={{ color }}>{icon}</span>
                  {label}
                </div>
                <span className="text-base font-bold text-slate-800 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
