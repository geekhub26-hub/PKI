import { useState } from 'react';
import { adminService } from '../services/api';

export default function AdminSignCsrPage() {
  const [csr, setCsr] = useState('');
  const [validityDays, setValidityDays] = useState(365);
  const [userId, setUserId] = useState('');
  const [certificate, setCertificate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSign() {
    setLoading(true);
    setError(null);
    setCertificate(null);
    try {
      const res = await adminService.signCsr(csr.trim(), validityDays, userId.trim() || undefined);
      setCertificate(res?.certificate || '');
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la signature.');
    } finally {
      setLoading(false);
    }
  }

  function downloadCert() {
    if (!certificate) return;
    const blob = new Blob([certificate], { type: 'application/x-pem-file' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificate.pem';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar">
        <h1 className="text-2xl font-bold text-white">Signer une CSR</h1>
        <p className="mt-1 text-sm text-white/70">
          Collez la CSR de l'utilisateur pour générer un certificat immédiatement.
        </p>
      </div>

      {/* Main form card */}
      <div className="pki-card p-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            CSR (PEM)
          </label>
          <textarea
            className="pki-input min-h-[200px] font-mono text-xs"
            value={csr}
            onChange={(e) => setCsr(e.target.value)}
            placeholder="-----BEGIN CERTIFICATE REQUEST-----"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Validité (jours)
            </label>
            <input
              type="number"
              min={1}
              className="pki-input"
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              ID utilisateur (optionnel)
            </label>
            <input
              type="text"
              className="pki-input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID utilisateur si besoin d'association"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="btn btn-green"
            onClick={handleSign}
            disabled={loading || !csr.trim()}
          >
            {loading ? 'Signature...' : 'Signer la CSR'}
          </button>
          <button
            className="btn btn-primary"
            onClick={downloadCert}
            disabled={!certificate}
          >
            Télécharger
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Result card */}
      <div className="pki-card p-5">
        <div className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Certificat généré</div>
        {certificate ? (
          <pre className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-xs font-mono overflow-auto max-h-80 text-slate-700 dark:text-slate-300">
            {certificate}
          </pre>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400">Aucun certificat généré pour l'instant.</div>
        )}
      </div>
    </div>
  );
}
