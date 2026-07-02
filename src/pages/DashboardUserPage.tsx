import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';
import { userService, Certificate } from '../services/api';
import {
  FilePlus, Clock3, ShieldCheck, XCircle,
  CalendarDays, Zap, FileText, Download,
} from 'lucide-react';

export default function DashboardUserPage() {
  const user = useAuthStore((state) => state.user);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userService.getMyCertificates()
      .then(setCertificates)
      .catch(() => setError('Erreur lors du chargement.'))
      .finally(() => setLoading(false));
  }, []);

  const nextExpiry = certificates.length > 0
    ? certificates
        .filter((c) => c.notAfter)
        .sort((a, b) => new Date(a.notAfter!).getTime() - new Date(b.notAfter!).getTime())[0]
        ?.notAfter?.slice(0, 10) ?? '—'
    : '—';

  const recentCerts = certificates.slice(0, 5);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Welcome banner */}
      <div className="page-header-bar">
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white select-none"
              style={{ background: 'rgba(255,255,255,0.14)', boxShadow: '0 0 0 2px rgba(255,255,255,0.2)' }}
            >
              {initials}
            </div>
            <div>
              <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-white/50">
                Bienvenue
              </p>
              <h1 className="text-xl font-bold leading-tight text-white">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="mt-0.5 text-sm text-white/60">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/generate-csr" className="btn btn-green">
              <FilePlus size={15} /> Nouvelle demande
            </Link>
            <Link to="/certificates" className="btn btn-primary">
              <ShieldCheck size={15} /> Mes certificats
            </Link>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="kpi-card green">
          <div className="kpi-icon green"><ShieldCheck size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{certificates.length}</div>
            <div className="kpi-label">Certificats</div>
          </div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Clock3 size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">—</div>
            <div className="kpi-label">Demandes actives</div>
          </div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon amber"><CalendarDays size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value" style={{ fontSize: '18px', letterSpacing: 0 }}>{nextExpiry}</div>
            <div className="kpi-label">Prochaine expiration</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick actions */}
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-emerald-500" />
              <span>Actions rapides</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/generate-csr" className="qa-card">
              <div className="qa-icon green"><FilePlus size={20} /></div>
              <span>Nouvelle demande</span>
            </Link>
            <Link to="/certificates" className="qa-card">
              <div className="qa-icon blue"><ShieldCheck size={20} /></div>
              <span>Mes certificats</span>
            </Link>
            <Link to="/requests" className="qa-card">
              <div className="qa-icon amber"><Clock3 size={20} /></div>
              <span>Suivi demandes</span>
            </Link>
            <Link to="/revoke" className="qa-card">
              <div className="qa-icon red"><XCircle size={20} /></div>
              <span>Révoquer</span>
            </Link>
            <Link to="/recepisses" className="qa-card">
              <div className="qa-icon violet"><FileText size={20} /></div>
              <span>Récépissés</span>
            </Link>
            <Link to="/download-crl" className="qa-card">
              <div className="qa-icon slate"><Download size={20} /></div>
              <span>Télécharger CRL</span>
            </Link>
          </div>
        </div>

        {/* Recent certificates */}
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-blue-500" />
              <span>Certificats récents</span>
            </div>
            <Link
              to="/certificates"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Voir tout →
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
            </div>
          ) : error ? (
            <p className="py-4 text-sm text-rose-500">{error}</p>
          ) : recentCerts.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
              <ShieldCheck size={30} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Aucun certificat</p>
              <p className="mt-1 text-xs text-slate-400">Lancez une demande pour démarrer.</p>
              <Link
                to="/generate-csr"
                className="btn btn-green mt-4"
                style={{ fontSize: '12px', padding: '7px 14px' }}
              >
                Commencer
              </Link>
            </div>
          ) : (
            <div>
              {recentCerts.map((cert) => (
                <div key={cert.id} className="recent-item">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {cert.subjectDN.split(',')[0]?.replace('CN=', '') || '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Expire le {cert.notAfter?.slice(0, 10) ?? '—'}
                    </p>
                  </div>
                  <span className="status-badge status-active shrink-0">Actif</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security tip */}
      <div className="pki-card flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
          <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Bonnes pratiques de sécurité</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Conservez vos fichiers de certificats dans un emplacement sécurisé et initiez le
            renouvellement bien avant la date d'expiration pour éviter toute interruption de service.
          </p>
        </div>
      </div>
    </div>
  );
}
