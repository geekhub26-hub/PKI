import { useState } from 'react';
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
      setMessage('CRL générée avec succès.');
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la génération.');
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
      setMessage(res?.crlPath ? `CRL pivotée : ${res.crlPath}` : 'CRL pivotée avec succès.');
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
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar">
        <h1 className="text-2xl font-bold text-white">Générer ou pivoter la CRL</h1>
        <p className="mt-1 text-sm text-white/70">
          Publiez une nouvelle liste de révocation et téléchargez-la pour diffusion.
        </p>
      </div>

      {/* Actions card */}
      <div className="pki-card p-6 space-y-5">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 text-sm text-slate-600 dark:text-slate-300">
          Générez la CRL pour publier la liste des certificats révoqués, ou pivotez-la pour forcer un renouvellement immédiat avec un nouveau numéro de séquence.
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-green"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Génération...' : 'Générer la CRL'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRotate}
            disabled={loading}
          >
            {loading ? 'Rotation...' : 'Faire pivoter'}
          </button>
          <button
            className="btn btn-primary"
            onClick={downloadCrl}
            disabled={!crlContent}
          >
            Télécharger
          </button>
        </div>

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
      </div>

      {/* CRL content card */}
      <div className="pki-card p-5">
        <div className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Contenu CRL</div>
        {crlContent ? (
          <pre className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-xs font-mono overflow-auto max-h-80 text-slate-700 dark:text-slate-300">
            {crlContent}
          </pre>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400">Aucune CRL générée pour l'instant.</div>
        )}
      </div>
    </div>
  );
}
