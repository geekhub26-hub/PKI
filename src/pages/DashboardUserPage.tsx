import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';
import { userService, Certificate } from '../services/api';
import { FileText, Clock3, ShieldCheck, XCircle, CircleUserRound } from 'lucide-react';

export default function DashboardUserPage() {
  const user = useAuthStore((state) => state.user);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userService.getMyCertificates()
      .then(setCertificates)
      .catch(() => setError('Erreur lors du chargement des certificats.'))
      .finally(() => setLoading(false));
  }, []);

  const nextExpiry = certificates.length > 0
    ? certificates
        .filter((c) => c.notAfter)
        .sort((a, b) => new Date(a.notAfter!).getTime() - new Date(b.notAfter!).getTime())[0]
        ?.notAfter?.slice(0, 10) ?? '—'
    : '—';

  const recentCerts = certificates.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <div className="page-header-bar">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <CircleUserRound size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{user?.firstName} {user?.lastName}</h1>
              <p className="text-sm text-slate-300">{user?.email}</p>
              <span className="mt-1.5 inline-flex rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold text-white ring-1 ring-white/20">
                {user?.role}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/generate-csr" className="btn btn-green">Nouvelle demande</Link>
            <Link to="/certificates" className="btn btn-primary">Mes certificats</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="stat-card green p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Certificats</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{certificates.length}</p>
        </div>
        <div className="stat-card blue p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Demandes</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">—</p>
        </div>
        <div className="stat-card amber p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Prochaine expiration</p>
          <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{nextExpiry}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="pki-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Actions rapides</p>
          <div className="space-y-2">
            <Link to="/generate-csr" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
              <FileText size={16} className="text-emerald-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Nouvelle demande</span>
            </Link>
            <Link to="/certificates" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
              <ShieldCheck size={16} className="text-blue-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Mes certificats</span>
            </Link>
            <Link to="/requests" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
              <Clock3 size={16} className="text-amber-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Suivi des demandes</span>
            </Link>
            <Link to="/revoke" className="pki-card flex items-center gap-3 px-4 py-3 transition hover:-translate-y-0.5">
              <XCircle size={16} className="text-red-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Révoquer un certificat</span>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="pki-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Mes certificats récents</p>
              <Link to="/certificates" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Voir tout
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : recentCerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-center text-sm text-slate-500 dark:text-slate-400">
                Aucun certificat pour le moment. Lancez une nouvelle demande pour démarrer.
              </div>
            ) : (
              <div className="space-y-2">
                {recentCerts.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {cert.subjectDN.split(',')[0]?.replace('CN=', '') || '—'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Expire le {cert.notAfter?.slice(0, 10) ?? '—'}
                      </p>
                    </div>
                    <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pki-card p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Bonnes pratiques</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <ShieldCheck size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                Conserver les fichiers de certificats dans un emplacement sécurisé.
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Clock3 size={14} className="text-amber-500 mt-0.5 shrink-0" />
                Lancer le renouvellement avant la date d'expiration.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
