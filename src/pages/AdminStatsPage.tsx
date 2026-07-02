import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  ArrowLeft, Users, Clock3, CheckCircle2, XCircle,
  Building2, CalendarClock, ShieldCheck, AlertTriangle,
  Activity, FileCheck2, KeyRound,
} from 'lucide-react';

export default function AdminStatsPage() {
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const data = await adminService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  const expDays = dashboard?.caStatus?.daysUntilExpiration;
  const requestSeries = [
    { name: 'En attente', value: dashboard?.pendingRequests || 0 },
    { name: 'Actifs',    value: dashboard?.activeCertificates || 0 },
    { name: 'Révoqués',  value: dashboard?.revokedCertificates || 0 },
  ];
  const volumeSeries = [
    { name: 'Utilisateurs', value: dashboard?.totalUsers || 0 },
    { name: 'Demandes',     value: dashboard?.pendingRequests || 0 },
    { name: 'Certificats',  value: dashboard?.activeCertificates || 0 },
  ];
  const statusColors = ['#2563eb', '#10b981', '#ef4444'];
  const ca = dashboard?.caStatus;

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">
              Administration PKI
            </p>
            <h1 className="text-2xl font-bold text-white">Statistiques système</h1>
            <p className="mt-0.5 text-sm text-white/60">{user?.email}</p>
          </div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <ArrowLeft size={14} /> Retour
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Users size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{dashboard?.totalUsers || 0}</div>
            <div className="kpi-label">Utilisateurs</div>
          </div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon amber"><Clock3 size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{dashboard?.pendingRequests || 0}</div>
            <div className="kpi-label">Demandes en attente</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><CheckCircle2 size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{dashboard?.activeCertificates || 0}</div>
            <div className="kpi-label">Certificats actifs</div>
          </div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-icon red"><XCircle size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{dashboard?.revokedCertificates || 0}</div>
            <div className="kpi-label">Révoqués</div>
          </div>
        </div>
      </div>

      {/* CA Details */}
      <div className="pki-card p-6">
        <div className="section-title">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-blue-500" />
            <span>Autorité de Certification</span>
          </div>
          {ca?.isInitialized && (
            <span className="status-badge status-active">Active et opérationnelle</span>
          )}
        </div>

        {ca?.isInitialized ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="info-row">
                <span className="info-row-label"><FileCheck2 size={12} /> Nom AC</span>
                <span className="info-row-value">{ca.caName || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label"><KeyRound size={12} /> Subject DN</span>
                <span className="info-row-value text-xs">{ca.subjectDN || 'N/A'}</span>
              </div>
            </div>
            <div>
              <div className="info-row">
                <span className="info-row-label"><CalendarClock size={12} /> Valide depuis</span>
                <span className="info-row-value">
                  {ca.validFrom ? new Date(ca.validFrom).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row-label"><CalendarClock size={12} /> Expire le</span>
                <span className="info-row-value">
                  {ca.validUntil ? new Date(ca.validUntil).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
              </div>
              {expDays !== undefined && (
                <div className="info-row">
                  <span className="info-row-label">
                    {expDays < 30
                      ? <AlertTriangle size={12} className="text-red-500" />
                      : <ShieldCheck size={12} className="text-emerald-500" />
                    } Jours restants
                  </span>
                  <span className={`info-row-value font-bold text-base ${expDays < 30 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {expDays}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-700/40 dark:bg-amber-900/20">
            <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle size={18} />
              <p className="font-semibold">AC non initialisée</p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Initialiser la CA racine avant émission des certificats.
            </p>
          </div>
        )}
      </div>

      {/* Activity + Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-blue-500" />
              <span>Activité système</span>
            </div>
          </div>
          <div className="info-row">
            <span className="info-row-label"><Clock3 size={12} className="text-amber-500" /> En attente</span>
            <span className="info-row-value text-amber-600 dark:text-amber-400 font-bold">
              {dashboard?.pendingRequests || 0}
            </span>
          </div>
          <div className="info-row">
            <span className="info-row-label"><CheckCircle2 size={12} className="text-emerald-500" /> Émis</span>
            <span className="info-row-value text-emerald-600 dark:text-emerald-400 font-bold">
              {dashboard?.activeCertificates || 0}
            </span>
          </div>
          <div className="info-row">
            <span className="info-row-label"><XCircle size={12} className="text-red-500" /> Révoqués</span>
            <span className="info-row-value text-red-600 dark:text-red-400 font-bold">
              {dashboard?.revokedCertificates || 0}
            </span>
          </div>
          <div className="info-row">
            <span className="info-row-label"><Users size={12} className="text-blue-500" /> Utilisateurs</span>
            <span className="info-row-value text-blue-600 dark:text-blue-400 font-bold">
              {dashboard?.totalUsers || 0}
            </span>
          </div>
        </div>

        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-500" />
              <span>Accès rapides</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <Link to="/admin/requests" className="action-row">
              <div className="action-row-icon amber"><Clock3 size={14} /></div>
              <span className="flex-1">Voir les demandes</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link to="/admin/generate-ca" className="action-row">
              <div className="action-row-icon green"><Building2 size={14} /></div>
              <span className="flex-1">Générer une CA</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link to="/admin/sign-csr" className="action-row">
              <div className="action-row-icon violet"><FileCheck2 size={14} /></div>
              <span className="flex-1">Signer une CSR</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link to="/admin/generate-crl" className="action-row">
              <div className="action-row-icon slate"><Activity size={14} /></div>
              <span className="flex-1">Générer une CRL</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link to="/admin/revoke-certificate" className="action-row">
              <div className="action-row-icon red"><XCircle size={14} /></div>
              <span className="flex-1">Révoquer un certificat</span>
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-blue-500" />
              <span>Répartition des statuts</span>
            </div>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={requestSeries} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {requestSeries.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-blue-500" />
              <span>Volumes globaux</span>
            </div>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
