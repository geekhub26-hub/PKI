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
    return <div className="card p-8 text-center text-[var(--text-3)]">Chargement des statistiques...</div>;
  }

  const expDays = dashboard?.caStatus?.daysUntilExpiration;
  const requestSeries = [
    { name: 'En attente', value: dashboard?.pendingRequests || 0 },
    { name: 'Actifs', value: dashboard?.activeCertificates || 0 },
    { name: 'Revoques', value: dashboard?.revokedCertificates || 0 },
  ];
  const volumeSeries = [
    { name: 'Utilisateurs', value: dashboard?.totalUsers || 0 },
    { name: 'Demandes', value: dashboard?.pendingRequests || 0 },
    { name: 'Certificats', value: dashboard?.activeCertificates || 0 },
  ];
  const statusColors = ['#2563eb', '#10b981', '#ef4444'];

  return (
    <div className="mx-auto max-w-7xl py-5">
      <header className="card mb-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h2 text-[var(--text-1)]">Statistiques du systeme</h1>
            <p className="text-sm text-[var(--text-3)]">Admin: {user?.email}</p>
          </div>
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-600)]">
            <ArrowLeft size={15} /> Retour dashboard
          </Link>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <StatTile icon={Users} label="Utilisateurs" value={dashboard?.totalUsers || 0} />
        <StatTile icon={Clock3} label="Demandes en attente" value={dashboard?.pendingRequests || 0} />
        <StatTile icon={CheckCircle2} label="Certificats actifs" value={dashboard?.activeCertificates || 0} />
        <StatTile icon={XCircle} label="Certificats revoques" value={dashboard?.revokedCertificates || 0} />
      </section>

      <section className="card mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h3 text-[var(--text-1)]">Autorite de certification</h2>
          <Building2 className="text-[var(--brand-600)]" size={22} />
        </div>

        {dashboard?.caStatus?.isInitialized ? (
          <div className="space-y-4">
            <div className="surface-soft flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-[var(--text-3)]">Etat</p>
                <p className="font-semibold text-[var(--success-600)]">Active et operationnelle</p>
              </div>
              <ShieldCheck size={20} className="text-[var(--success-600)]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <InfoBox icon={FileCheck2} label="Nom AC" value={dashboard.caStatus.caName} />
              <InfoBox icon={KeyRound} label="Distinguished Name" value={dashboard.caStatus.subjectDN} mono />
              <InfoBox icon={CalendarClock} label="Valide depuis" value={dashboard.caStatus.validFrom ? new Date(dashboard.caStatus.validFrom).toLocaleDateString('fr-FR') : 'N/A'} />
              <InfoBox icon={CalendarClock} label="Expire le" value={dashboard.caStatus.validUntil ? new Date(dashboard.caStatus.validUntil).toLocaleDateString('fr-FR') : 'N/A'} />
            </div>

            {expDays !== undefined && (
              <div className="surface-soft flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-[var(--text-3)]">Jours avant expiration</p>
                  <p className="text-2xl font-bold text-[var(--text-1)]">{expDays}</p>
                </div>
                {expDays < 30 ? <AlertTriangle className="text-[var(--danger-600)]" /> : <ShieldCheck className="text-[var(--success-600)]" />}
              </div>
            )}
          </div>
        ) : (
          <div className="surface-soft p-5">
            <div className="mb-2 flex items-center gap-2 text-[var(--warning-600)]">
              <AlertTriangle size={18} />
              <p className="font-semibold">AC non initialisee</p>
            </div>
            <p className="text-sm text-[var(--text-2)]">Initialiser la CA racine avant emission des certificats.</p>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 text-h4 text-[var(--text-1)]">Activite</h3>
          <SummaryItem icon={Clock3} label="Demandes en attente" value={dashboard?.pendingRequests || 0} />
          <SummaryItem icon={CheckCircle2} label="Certificats emis" value={dashboard?.activeCertificates || 0} />
          <SummaryItem icon={XCircle} label="Certificats revoques" value={dashboard?.revokedCertificates || 0} />
          <SummaryItem icon={Users} label="Utilisateurs" value={dashboard?.totalUsers || 0} />
        </div>

        <div className="card p-6">
          <h3 className="mb-4 text-h4 text-[var(--text-1)]">Actions rapides</h3>
          <ActionLink to="/admin/requests" icon={Activity} text="Voir les demandes" />
          <ActionLink to="/admin/generate-ca" icon={Building2} text="Generer une CA" />
          <ActionLink to="/admin/sign-csr" icon={FileCheck2} text="Signer une CSR" />
          <ActionLink to="/admin/generate-crl" icon={RefreshCw} text="Generer une CRL" />
          <ActionLink to="/admin/revoke-certificate" icon={XCircle} text="Revoquer un certificat" />
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h4 text-[var(--text-1)]">Repartition des statuts</h3>
            <Activity size={18} className="text-[var(--brand-600)]" />
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

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h4 text-[var(--text-1)]">Volumes globaux</h3>
            <Users size={18} className="text-[var(--brand-600)]" />
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
      </section>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: any) {
  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-[var(--text-3)]">{label}</p>
        <Icon size={16} className="text-[var(--brand-600)]" />
      </div>
      <p className="text-3xl font-extrabold text-[var(--text-1)]">{value}</p>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value, mono = false }: any) {
  return (
    <div className="surface-soft p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-[var(--text-3)]">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <p className={`font-semibold text-[var(--text-1)] ${mono ? 'break-all text-xs' : ''}`}>{value || 'N/A'}</p>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }: any) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm text-[var(--text-2)]">
        <Icon size={15} className="text-[var(--brand-600)]" />
        {label}
      </div>
      <span className="font-bold text-[var(--text-1)]">{value}</span>
    </div>
  );
}

function ActionLink({ to, icon: Icon, text }: any) {
  return (
    <Link to={to} className="mb-2 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-semibold text-[var(--text-1)] transition hover:bg-[var(--surface-3)]">
      <span className="flex items-center gap-2">
        <Icon size={15} className="text-[var(--brand-600)]" />
        {text}
      </span>
      <span className="text-[var(--text-3)]">&rarr;</span>
    </Link>
  );
}
