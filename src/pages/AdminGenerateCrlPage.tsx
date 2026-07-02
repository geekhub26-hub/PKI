import { useState } from 'react';
import { adminService } from '../services/api';
import { RefreshCw, RotateCcw, Download, CheckCircle, ShieldOff } from 'lucide-react';

export default function AdminGenerateCrlPage() {
  const [loading, setLoading]       = useState(false);
  const [crlContent, setCrlContent] = useState<string>('');
  const [message, setMessage]       = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true); setError(null); setMessage(null);
    try {
      const res = await adminService.generateCrl();
      setCrlContent(res?.crl || '');
      setMessage('CRL générée et publiée avec succès.');
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la génération.');
    } finally { setLoading(false); }
  }

  async function handleRotate() {
    setLoading(true); setError(null); setMessage(null);
    try {
      const res = await adminService.rotateCrl();
      const crl = await adminService.getCrl();
      setCrlContent(crl || '');
      setMessage(res?.crlPath ? `CRL pivotée : ${res.crlPath}` : 'CRL pivotée avec succès.');
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la rotation.');
    } finally { setLoading(false); }
  }

  function downloadCrl() {
    const blob = new Blob([crlContent], { type: 'application/pkix-crl' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'crl.pem';
    document.body.appendChild(a); a.click();
    window.URL.revokeObjectURL(url); document.body.removeChild(a);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <ShieldOff size={22} /> Générer / Pivoter la CRL
            </h1>
            <p className="mt-0.5 text-sm text-white/60">
              Publiez la liste de révocation ou forcez un renouvellement immédiat.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <ShieldOff size={24} className="text-white" />
          </div>
        </div>
      </div>

      {/* Info + Actions */}
      <div className="pki-card p-6">
        <div className="section-title">
          <div className="flex items-center gap-2">
            <RefreshCw size={15} className="text-blue-500" />
            <span>Actions CRL</span>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-300">
          <ul className="space-y-1">
            <li><span className="font-semibold">Générer</span> — publie une nouvelle CRL avec les certificats actuellement révoqués.</li>
            <li><span className="font-semibold">Pivoter</span> — force un renouvellement avec un nouveau numéro de séquence, même sans changement.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn btn-green" onClick={handleGenerate} disabled={loading}>
            <RefreshCw size={15} />
            {loading ? 'Génération...' : 'Générer la CRL'}
          </button>
          <button className="btn btn-primary" onClick={handleRotate} disabled={loading}>
            <RotateCcw size={15} />
            {loading ? 'Rotation...' : 'Faire pivoter'}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800/30 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={downloadCrl}
            disabled={!crlContent}
          >
            <Download size={14} /> Télécharger (.pem)
          </button>
        </div>

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle size={16} /> {message}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* CRL Preview */}
      <div className="pki-card p-5">
        <div className="section-title">
          <div className="flex items-center gap-2">
            <ShieldOff size={15} className="text-slate-500" />
            <span>Contenu CRL</span>
          </div>
          {crlContent && <span className="status-badge status-active">Disponible</span>}
        </div>
        {crlContent ? (
          <pre className="max-h-80 overflow-auto rounded-xl bg-slate-50 dark:bg-slate-800 p-3 font-mono text-xs text-slate-700 dark:text-slate-300">
            {crlContent}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <ShieldOff size={22} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">Aucune CRL générée.</p>
            <p className="mt-1 text-xs text-slate-400">Cliquez sur « Générer la CRL » pour publier la liste de révocation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
