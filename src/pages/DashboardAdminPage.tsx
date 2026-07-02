import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { Link } from 'react-router-dom';
import {
  BarChart3, Users, Building2, PencilLine,
  RefreshCw, XCircle, Download, CheckCircle2,
  Clock3, ShieldCheck, AlertTriangle, ChevronRight,
  Zap, CalendarClock, KeyRound, FileCheck2,
} from 'lucide-react';

export default function DashboardAdminPage() {
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInitModal, setShowInitModal] = useState(false);
  const [busyInit, setBusyInit] = useState(false);
  const { addToast } = useToast();

  useEffect(() => { loadDashboard(); }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  const ca = dashboard?.caStatus;

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      {/* Banner */}
      <div className="page-header-bar">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">
              Administration PKI — ANTIC
            </p>
            <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
            <p className="mt-0.5 text-sm text-white/60">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/15 px-5 py-3 ring-1 ring-emerald-400/30">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <ShieldCheck size={16} className="text-emerald-300" />
            <span className="text-sm font-semibold text-emerald-200">Système opérationnel</span>
          </div>
        </div>
      </div>

      {/* 4 KPI cards */}
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

      {/* CA Info + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CA Status — 2/3 */}
        <div className="pki-card p-6 lg:col-span-2">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-blue-500" />
              <span>Autorité de Certification</span>
            </div>
            {ca?.isInitialized && (
              <span className="status-badge status-active">Opérationnelle</span>
            )}
          </div>

          {ca?.isInitialized ? (
            <div>
              <div className="info-row">
                <span className="info-row-label"><FileCheck2 size={12} /> Nom AC</span>
                <span className="info-row-value">{ca.caName || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label"><KeyRound size={12} /> Subject DN</span>
                <span className="info-row-value text-xs">{ca.subjectDN || 'N/A'}</span>
              </div>
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
              {ca.daysUntilExpiration !== undefined && (
                <div className="info-row">
                  <span className="info-row-label">
                    {ca.daysUntilExpiration < 30
                      ? <AlertTriangle size={12} className="text-red-500" />
                      : <ShieldCheck size={12} className="text-emerald-500" />
                    } Jours restants
                  </span>
                  <span className={`info-row-value font-bold ${ca.daysUntilExpiration < 30 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {ca.daysUntilExpiration} jours
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-700/40 dark:bg-amber-900/20">
              <div className="mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
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

        {/* Quick Actions — 1/3 */}
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-emerald-500" />
              <span>Actions admin</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <Link to="/admin/requests" className="action-row">
              <div className="action-row-icon amber"><Clock3 size={15} /></div>
              <span className="flex-1">Voir les demandes</span>
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
            <Link to="/admin/stats" className="action-row">
              <div className="action-row-icon blue"><BarChart3 size={15} /></div>
              <span className="flex-1">Statistiques</span>
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
            <Link to="/admin/generate-ca" className="action-row">
              <div className="action-row-icon green"><Building2 size={15} /></div>
              <span className="flex-1">Générer une CA</span>
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
            <Link to="/admin/sign-csr" className="action-row">
              <div className="action-row-icon violet"><PencilLine size={15} /></div>
              <span className="flex-1">Signer une CSR</span>
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
            <Link to="/admin/generate-crl" className="action-row">
              <div className="action-row-icon slate"><RefreshCw size={15} /></div>
              <span className="flex-1">Générer CRL</span>
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
            <Link to="/admin/download-crl" className="action-row">
              <div className="action-row-icon slate"><Download size={15} /></div>
              <span className="flex-1">Télécharger CRL</span>
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
            <Link to="/admin/revoke-certificate" className="action-row">
              <div className="action-row-icon red"><XCircle size={15} /></div>
              <span className="flex-1">Révoquer</span>
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
            <Link to="/admin/manage-users" className="action-row">
              <div className="action-row-icon blue"><Users size={15} /></div>
              <span className="flex-1">Gérer utilisateurs</span>
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      <Modal
        open={showInitModal}
        title="Initialiser l'AC racine"
        onClose={() => setShowInitModal(false)}
        footer={(
          <>
            <Button onClick={() => setShowInitModal(false)} variant="secondary">Annuler</Button>
            <Button onClick={confirmInitialize} disabled={busyInit}>
              {busyInit ? 'Traitement...' : 'Confirmer'}
            </Button>
          </>
        )}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Cette action crée la clé et le certificat de l'AC racine.
        </p>
      </Modal>
    </div>
  );
}
