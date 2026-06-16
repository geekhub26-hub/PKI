import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Building2,
  PencilLine,
  RefreshCw,
  XCircle,
  Download,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardAdminPage() {
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInitModal, setShowInitModal] = useState(false);
  const [busyInit, setBusyInit] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await adminService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const confirmInitialize = async () => {
    setBusyInit(true);
    try {
      await adminService.initializeCA();
      await loadDashboard();
      addToast({ type: 'success', message: 'AC racine initialisee avec succes.' });
      setShowInitModal(false);
    } catch (error: any) {
      addToast({ type: 'error', message: error?.message || 'Erreur lors de l initialisation.' });
    } finally {
      setBusyInit(false);
    }
  };

  if (loading) return <div className="p-8 text-[var(--text-3)]">Chargement...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <header className="rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary-50 via-white to-white p-6 shadow-sm dark:border-neutral-800 dark:from-primary-950/40 dark:via-neutral-950 dark:to-neutral-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-h2 text-[var(--text-1)]">Tableau de bord administrateur</h1>
            <p className="mt-1 text-sm text-[var(--text-3)]">Connecte en tant que {user?.email}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[var(--brand-700)] shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-primary-200 dark:ring-neutral-800">
            <ShieldCheck size={16} />
            Controle centralise PKI
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <QuickLink to="/admin/stats" icon={BarChart3} text="Statistiques" />
        <QuickLink to="/admin/manage-users" icon={Users} text="Utilisateurs" />
        <QuickLink to="/admin/requests" icon={Clock3} text="Demandes" />
        <QuickLink to="/admin/download-crl" icon={Download} text="CRL" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Utilisateurs" value={dashboard?.totalUsers || 0} />
        <StatCard icon={Clock3} label="Demandes en attente" value={dashboard?.pendingRequests || 0} />
        <StatCard icon={CheckCircle2} label="Certificats actifs" value={dashboard?.activeCertificates || 0} />
        <StatCard icon={XCircle} label="Certificats revoques" value={dashboard?.revokedCertificates || 0} />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h3 text-[var(--text-1)]">Autorite de certification</h2>
          <Building2 className="text-[var(--brand-600)]" size={22} />
        </div>

        {dashboard?.caStatus?.isInitialized ? (
          <div className="space-y-4">
            <div className="surface-soft flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-[var(--text-3)]">Statut</p>
                <p className="font-semibold text-[var(--success-600)]">Active</p>
              </div>
              <ShieldCheck size={20} className="text-[var(--success-600)]" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Nom AC" value={dashboard.caStatus.caName} />
              <Info label="Subject DN" value={dashboard.caStatus.subjectDN} mono />
              <Info label="Valide depuis" value={dashboard.caStatus.validFrom ? new Date(dashboard.caStatus.validFrom).toLocaleDateString('fr-FR') : 'N/A'} />
              <Info label="Expire le" value={dashboard.caStatus.validUntil ? new Date(dashboard.caStatus.validUntil).toLocaleDateString('fr-FR') : 'N/A'} />
            </div>
          </div>
        ) : (
          <div className="surface-soft p-5">
            <div className="mb-3 flex items-center gap-2 text-[var(--warning-600)]">
              <AlertTriangle size={18} />
              <p className="font-semibold">Aucune AC active</p>
            </div>
            <p className="mb-4 text-sm text-[var(--text-2)]">Initialisez une AC racine avant d approuver les CSR.</p>
            <Button onClick={() => setShowInitModal(true)}>Initialiser l AC</Button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <QuickLink to="/admin/generate-ca" icon={Building2} text="Generer AC" />
        <QuickLink to="/admin/sign-csr" icon={PencilLine} text="Signer CSR" />
        <QuickLink to="/admin/generate-crl" icon={RefreshCw} text="Generer CRL" />
        <QuickLink to="/admin/revoke-certificate" icon={XCircle} text="Revoquer cert" />
      </section>

      <Modal
        open={showInitModal}
        title="Initialiser l AC racine"
        onClose={() => setShowInitModal(false)}
        footer={(
          <>
            <Button onClick={() => setShowInitModal(false)} variant="secondary">Annuler</Button>
            <Button onClick={confirmInitialize} disabled={busyInit}>{busyInit ? 'Traitement...' : 'Confirmer'}</Button>
          </>
        )}
      >
        <p className="text-sm text-[var(--text-2)]">Cette action cree la cle et le certificat de l AC racine.</p>
      </Modal>
    </div>
  );
}

function QuickLink({ to, icon: Icon, text }: any) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-[var(--brand-700)] group-hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-200">
        <Icon size={18} />
      </span>
      <span className="text-sm font-semibold text-[var(--text-1)]">{text}</span>
    </Link>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-[var(--text-3)]">{label}</p>
        <Icon size={16} className="text-[var(--brand-600)]" />
      </div>
      <p className="text-3xl font-extrabold text-[var(--text-1)]">{value || 0}</p>
    </div>
  );
}

function Info({ label, value, mono = false }: any) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className={`mt-1 font-semibold text-[var(--text-1)] ${mono ? 'break-all text-xs' : ''}`}>{value || 'N/A'}</p>
    </div>
  );
}
