import { useState } from 'react';
import Button from '../components/Button';
import { adminService } from '../services/api';

export default function AdminGenerateCrlPage() {
  const [loading, setLoading] = useState(false);
  const [crlContent, setCrlContent] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await adminService.generateCrl();
      setCrlContent(res?.crl || '');
      setMessage('CRL generee avec succes.');
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la generation.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRotate() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await adminService.rotateCrl();
      const crl = await adminService.getCrl();
      setCrlContent(crl || '');
      setMessage(res?.crlPath ? `CRL pivotee: ${res.crlPath}` : 'CRL pivotee avec succes.');
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la rotation.');
    } finally {
      setLoading(false);
    }
  }

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
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          CRL / Rotation
        </div>
        <h1 className="text-h3 font-semibold text-[var(--text-1)]">Generer ou pivoter la CRL</h1>
        <p className="mt-2 text-sm text-[var(--text-3)]">
          Publiez une nouvelle liste de revocation et telechargez-la pour diffusion.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleGenerate} disabled={loading}>Generer la CRL</Button>
        <Button onClick={handleRotate} variant="secondary" disabled={loading}>Faire pivoter</Button>
        <Button onClick={downloadCrl} variant="outline" disabled={!crlContent}>Telecharger</Button>
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

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Contenu CRL</div>
        {crlContent ? (
          <pre className="max-h-96 overflow-auto rounded-lg bg-neutral-100 p-3 text-xs text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
            {crlContent}
          </pre>
        ) : (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Aucune CRL generee pour l'instant.</div>
        )}
      </div>
    </div>
  );
}
