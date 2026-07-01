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
      addToast({ type: 'success', message: 'AC racine initialisée avec succès.' });
      setShowInitModal(false);
    } catch (error: any) {
      addToast({ type: 'error', message: error?.message || "Erreur lors de l'initialisation." });
    } finally {
      setBusyInit(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Chargement...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="page-header-bar">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tableau de bord administrateur</h1>
            <p className="mt-1 text-sm text-slate-300">Connecté en tant que {user?.email}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
            <ShieldCheck size={15} />
            Contrôle PKI ANTIC
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Link to="/admin/stats" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
          <BarChart3 size={18} className="text-blue-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Statistiques</span>
        </Link>
        <Link to="/admin/manage-users" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
          <Users size={18} className="text-emerald-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Utilisateurs</span>
        </Link>
        <Link to="/admin/requests" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
          <Clock3 size={18} className="text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Demandes</span>
        </Link>
        <Link to="/admin/download-crl" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
          <Download size={18} className="text-slate-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">CRL</span>
        </Link>
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
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Statut</p>
                <span className="status-badge status-active">Active</span>
              </div>
              <ShieldCheck size={22} className="text-emerald-500" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Nom AC</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{dashboard.caStatus.caName || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Subject DN</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100 break-all text-xs">{dashboard.caStatus.subjectDN || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Valide depuis</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {dashboard.caStatus.validFrom ? new Date(dashboard.caStatus.validFrom).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Expire le</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {dashboard.caStatus.validUntil ? new Date(dashboard.caStatus.validUntil).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/40 p-5">
            <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} />
              <p className="font-semibold">Aucune AC active</p>
            </div>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              Initialisez une AC racine avant d'approuver les CSR.
            </p>
            <Button onClick={() => setShowInitModal(true)}>Initialiser l'AC</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Link to="/admin/generate-ca" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
          <Building2 size={18} className="text-blue-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Générer AC</span>
        </Link>
        <Link to="/admin/sign-csr" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
          <PencilLine size={18} className="text-emerald-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Signer CSR</span>
        </Link>
        <Link to="/admin/generate-crl" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
          <RefreshCw size={18} className="text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Générer CRL</span>
        </Link>
        <Link to="/admin/revoke-certificate" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
          <XCircle size={18} className="text-red-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Révoquer</span>
        </Link>
      </div>

      <Modal
        open={showInitModal}
        title="Initialiser l'AC racine"
        onClose={() => setShowInitModal(false)}
        footer={(
          <>
            <Button onClick={() => setShowInitModal(false)} variant="secondary">Annuler</Button>
            <Button onClick={confirmInitialize} disabled={busyInit}>{busyInit ? 'Traitement...' : 'Confirmer'}</Button>
          </>
        )}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">Cette action crée la clé et le certificat de l'AC racine.</p>
      </Modal>
    </div>
  );
}
