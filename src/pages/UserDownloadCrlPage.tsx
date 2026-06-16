import { useEffect, useState } from 'react';
import Button from '../components/Button';
import { userService } from '../services/api';

export default function UserDownloadCrlPage() {
  const [crlContent, setCrlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userService
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
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          CRL Utilisateur
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Telecharger la CRL</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          La CRL permet de verifier si un certificat a ete revoque.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Chargement...</div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          <Button onClick={downloadCrl} disabled={!crlContent}>Telecharger la CRL</Button>
          <pre className="max-h-96 overflow-auto rounded-lg bg-neutral-100 p-3 text-xs text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
            {crlContent}
          </pre>
        </div>
      )}
    </div>
  );
}
