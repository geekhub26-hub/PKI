import { useEffect, useState } from 'react';
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
      setMessage('Votre certificat a été révoqué.');
      const refreshed = await userService.getMyCertificates();
      setCertificates(refreshed);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la révocation.');
    }
  }

  function statusBadgeClass(s: string) {
    switch (s) {
      case 'ACTIVE': return 'status-badge status-active';
      case 'REVOKED': return 'status-badge status-revoked';
      case 'EXPIRED': return 'status-badge status-rejected';
      default: return 'status-badge status-pending';
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar">
        <h1 className="text-2xl font-bold text-white">Révoquer un certificat</h1>
        <p className="mt-1 text-sm text-white/70">
          Si votre clé est compromise, vous pouvez révoquer un certificat actif.
        </p>
      </div>

      {/* Banners */}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">Chargement...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <div key={cert.id} className="pki-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {cert.subjectDN?.split(',')[0]?.replace('CN=', '') || cert.id}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Série : {cert.serialNumber}
                  </div>
                </div>
                <span className={statusBadgeClass(cert.status)}>{cert.status}</span>
              </div>

              {cert.status === 'ACTIVE' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="pki-input !text-xs"
                    placeholder="Raison de révocation (optionnel)"
                    value={reasons[cert.id] || ''}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                  />
                  <button
                    className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors w-full"
                    onClick={() => handleRevoke(cert.id)}
                  >
                    Révoquer
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Certificat déjà révoqué.
                </div>
              )}
            </div>
          ))}

          {certificates.length === 0 && (
            <div className="md:col-span-2 pki-card p-8 text-center text-sm text-slate-500 dark:text-slate-400 border-dashed">
              Aucun certificat disponible.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
