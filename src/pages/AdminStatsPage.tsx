import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  Users,
  Clock3,
  CheckCircle2,
  XCircle,
  Building2,
  CalendarClock,
  ShieldCheck,
  AlertTriangle,
  Activity,
  FileCheck2,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

export default function AdminStatsPage() {
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="pki-card p-8 text-center text-slate-500 dark:text-slate-400">Chargement des statistiques...</div>;
  }

  const expDays = dashboard?.caStatus?.daysUntilExpiration;
  const requestSeries = [
    { name: 'En attente', value: dashboard?.pendingRequests || 0 },
    { name: 'Actifs', value: dashboard?.activeCertificates || 0 },
    { name: 'Révoqués', value: dashboard?.revokedCertificates || 0 },
  ];
  const volumeSeries = [
    { name: 'Utilisateurs', value: dashboard?.totalUsers || 0 },
    { name: 'Demandes', value: dashboard?.pendingRequests || 0 },
    { name: 'Certificats', value: dashboard?.activeCertificates || 0 },
  ];
  const statusColors = ['#2563eb', '#10b981', '#ef4444'];

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="page-header-bar">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Statistiques système</h1>
            <p className="mt-1 text-sm text-slate-300">Admin : {user?.email}</p>
          </div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition"
          >
            <ArrowLeft size={14} /> Retour
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="stat-card blue p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Utilisateurs</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{dashboard?.totalUsers || 0}</p>
          <Users size={16} className="text-blue-400 mt-2" />
        </div>
        <div className="stat-card amber p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Demandes en attente</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{dashboard?.pendingRequests || 0}</p>
          <Clock3 size={16} className="text-amber-400 mt-2" />
        </div>
        <div className="stat-card green p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Certificats actifs</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{dashboard?.activeCertificates || 0}</p>
          <CheckCircle2 size={16} className="text-emerald-400 mt-2" />
        </div>
        <div className="stat-card red p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Révoqués</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{dashboard?.revokedCertificates || 0}</p>
          <XCircle size={16} className="text-red-400 mt-2" />
        </div>
      </div>

      <div className="pki-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 size={20} className="text-blue-500" />
            Autorité de certification
          </h2>
        </div>

        {dashboard?.caStatus?.isInitialized ? (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">État</p>
                <span className="status-badge status-active">Active et opérationnelle</span>
              </div>
              <ShieldCheck size={22} className="text-emerald-500" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                  <FileCheck2 size={13} />
                  Nom AC
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{dashboard.caStatus.caName || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                  <KeyRound size={13} />
                  Distinguished Name
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 break-all text-xs">{dashboard.caStatus.subjectDN || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                  <CalendarClock size={13} />
                  Valide depuis
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {dashboard.caStatus.validFrom ? new Date(dashboard.caStatus.validFrom).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                  <CalendarClock size={13} />
                  Expire le
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {dashboard.caStatus.validUntil ? new Date(dashboard.caStatus.validUntil).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>

            {expDays !== undefined && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Jours avant expiration</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{expDays}</p>
                </div>
                {expDays < 30
                  ? <AlertTriangle className="text-red-500" size={22} />
                  : <ShieldCheck className="text-emerald-500" size={22} />
                }
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/40 p-5">
            <div className="mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} />
              <p className="font-semibold">AC non initialisée</p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Initialiser la CA racine avant émission des certificats.</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="pki-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Activité</p>
          <div className="space-y-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Clock3 size={15} className="text-amber-500" />
                Demandes en attente
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100">{dashboard?.pendingRequests || 0}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 size={15} className="text-emerald-500" />
                Certificats émis
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100">{dashboard?.activeCertificates || 0}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <XCircle size={15} className="text-red-500" />
                Certificats révoqués
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100">{dashboard?.revokedCertificates || 0}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Users size={15} className="text-blue-500" />
                Utilisateurs
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100">{dashboard?.totalUsers || 0}</span>
            </div>
          </div>
        </div>

        <div className="pki-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Actions rapides</p>
          <div className="space-y-2">
            <Link to="/admin/requests" className="pki-card flex items-center gap-3 px-3 py-2.5 transition hover:-translate-y-0.5">
              <Activity size={15} className="text-blue-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1">Voir les demandes</span>
              <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
            </Link>
            <Link to="/admin/generate-ca" className="pki-card flex items-center gap-3 px-3 py-2.5 transition hover:-translate-y-0.5">
              <Building2 size={15} className="text-emerald-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1">Générer une CA</span>
              <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
            </Link>
            <Link to="/admin/sign-csr" className="pki-card flex items-center gap-3 px-3 py-2.5 transition hover:-translate-y-0.5">
              <FileCheck2 size={15} className="text-amber-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1">Signer une CSR</span>
              <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
            </Link>
            <Link to="/admin/generate-crl" className="pki-card flex items-center gap-3 px-3 py-2.5 transition hover:-translate-y-0.5">
              <RefreshCw size={15} className="text-slate-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1">Générer une CRL</span>
              <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
            </Link>
            <Link to="/admin/revoke-certificate" className="pki-card flex items-center gap-3 px-3 py-2.5 transition hover:-translate-y-0.5">
              <XCircle size={15} className="text-red-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1">Révoquer un certificat</span>
              <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="pki-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Répartition des statuts</p>
            <Activity size={18} className="text-blue-500" />
          </div>
          <div className="h-64 sm:h-72 md:h-80">
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
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Volumes globaux</p>
            <Users size={18} className="text-blue-500" />
          </div>
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
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
