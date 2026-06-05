import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';
import { userService, Certificate } from '../services/api';
import { FileText, Clock3, ShieldCheck, Download, CircleUserRound } from 'lucide-react';

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

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <header className="rounded-2xl border border-neutral-200 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary-50 via-white to-white p-6 shadow-sm dark:border-neutral-800 dark:from-primary-950/40 dark:via-neutral-950 dark:to-neutral-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[var(--brand-600)] shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
              <CircleUserRound size={30} />
            </div>
            <div>
              <h2 className="text-h4 text-[var(--text-1)]">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-[var(--text-3)]">{user?.email}</p>
              <span className="mt-2 inline-flex rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">{user?.role}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/generate-csr" className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700">
              Nouvelle demande
            </Link>
            <Link to="/requests" className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
              Suivi des demandes
            </Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center dark:border-neutral-800 dark:bg-neutral-950/40">
              <p className="text-xs text-[var(--text-3)]">Certificats</p>
              <p className="text-2xl font-bold text-[var(--text-1)]">{certificates.length}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center dark:border-neutral-800 dark:bg-neutral-950/40">
              <p className="text-xs text-[var(--text-3)]">Demandes</p>
              <p className="text-2xl font-bold text-[var(--text-1)]">-</p>
            </div>
          </div>
          <div className="space-y-3">
            <Link to="/generate-csr" className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--text-1)] transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800">
              <FileText size={16} className="text-[var(--brand-600)]" />
              Nouvelle demande
            </Link>
            <Link to="/requests" className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--text-1)] transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800">
              <Clock3 size={16} className="text-[var(--brand-600)]" />
              Suivi des demandes
            </Link>
          </div>
        </div>

        <section className="space-y-6 md:col-span-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-h4 text-[var(--text-1)]">Mes certificats</h3>
              <Link to="/certificates" className="text-sm font-semibold text-[var(--brand-600)]">Voir tout</Link>
            </div>

            {loading ? (
              <p className="text-[var(--text-3)]">Chargement...</p>
            ) : error ? (
              <p className="text-[var(--danger-600)]">{error}</p>
            ) : certificates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950/40 dark:text-neutral-300">
                Aucun certificat pour le moment. Lancez une nouvelle demande pour demarrer.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {certificates.map((cert) => (
                  <article key={cert.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                    <div className="mb-1 flex items-center gap-2 text-xs text-[var(--text-3)]">
                      <ShieldCheck size={14} />
                      Certificat actif
                    </div>
                    <p className="font-semibold text-[var(--text-1)]">
                      {cert.subjectDN.split(',')[0]?.replace('CN=', '') || '-'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-3)]">Valide jusqu au {cert.notAfter?.slice(0, 10)}</p>
                    <button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-1)] transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                      <Download size={14} />
                      Telecharger
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h4 className="mb-2 text-[var(--text-1)]">Bonnes pratiques</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-2)]">
              <li>Conserver les fichiers de certificats dans un emplacement securise.</li>
              <li>Lancer le renouvellement avant la date d expiration.</li>
            </ul>
          </div>
        </section>
      </section>
    </div>
  );
}
