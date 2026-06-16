import { useEffect, useState } from 'react';
import Button from '../components/Button';
import { Certificate, userService } from '../services/api';

export default function UserRevokeCertificatePage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    userService
      .getMyCertificates()
      .then(setCertificates)
      .catch(() => setError('Erreur lors du chargement des certificats.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleRevoke(id: string) {
    setError(null);
    setMessage(null);
    try {
      await userService.revokeCertificate(id, reasons[id]);
      setMessage('Votre certificat a ete revoque.');
      const refreshed = await userService.getMyCertificates();
      setCertificates(refreshed);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la revocation.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          Revocation utilisateur
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Revoquer un certificat</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Si votre cle est compromise, vous pouvez revoquer un certificat actif.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Chargement...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <div key={cert.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {cert.subjectDN?.split(',')[0]?.replace('CN=', '') || cert.id}
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {cert.status}
                </span>
              </div>
              <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">Serie: {cert.serialNumber}</div>

              {cert.status === 'ACTIVE' ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                    placeholder="Raison de revocation (optionnel)"
                    value={reasons[cert.id] || ''}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                  />
                  <Button onClick={() => handleRevoke(cert.id)}>Revoquer</Button>
                </div>
              ) : (
                <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                  Certificat deja revoque.
                </div>
              )}
            </div>
          ))}

          {certificates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
              Aucun certificat disponible.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
