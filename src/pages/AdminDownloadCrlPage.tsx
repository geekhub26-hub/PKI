import { useEffect, useState } from 'react';
import { adminService } from '../services/api';

export default function AdminDownloadCrlPage() {
  const [crlContent, setCrlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .getCrl()
      .then(setCrlContent)
      .catch((e: any) => setError(e?.message || 'Erreur lors du chargement de la CRL.'))
      .finally(() => setLoading(false));
  }, []);

  function downloadCrl() {
    const blob = new Blob([crlContent], { type: 'application/pkix-crl' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crl.pem';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar">
        <h1 className="text-2xl font-bold text-white">Télécharger la CRL</h1>
        <p className="mt-1 text-sm text-white/70">
          Consultez la dernière CRL publiée et téléchargez-la.
        </p>
      </div>

      {/* Main card */}
      <div className="pki-card p-6 space-y-5">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 text-sm text-slate-600 dark:text-slate-300">
          La CRL (Certificate Revocation List) contient la liste des certificats révoqués par l'autorité de certification.
          Téléchargez-la pour la distribuer ou l'intégrer dans vos systèmes.
        </div>

        {loading ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">Chargement...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              className="btn btn-primary"
              onClick={downloadCrl}
              disabled={!crlContent}
            >
              Télécharger la CRL
            </button>
            {crlContent && (
              <pre className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-xs font-mono overflow-auto max-h-80 text-slate-700 dark:text-slate-300">
                {crlContent}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
