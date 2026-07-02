import { useState } from 'react';
import { adminService } from '../services/api';
import { KeyRound, Download, CheckCircle, FileText, User, Calendar } from 'lucide-react';

export default function AdminSignCsrPage() {
  const [csr, setCsr]               = useState('');
  const [validityDays, setValidityDays] = useState(365);
  const [userId, setUserId]         = useState('');
  const [certificate, setCertificate] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

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
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <KeyRound size={22} /> Signer une CSR
            </h1>
            <p className="mt-0.5 text-sm text-white/60">
              Collez la CSR d'un utilisateur pour générer un certificat immédiatement.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <KeyRound size={24} className="text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — form */}
        <div className="space-y-5 lg:col-span-2">
          {/* CSR */}
          <div className="pki-card p-6">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-blue-500" />
                <span>CSR (PEM)</span>
              </div>
            </div>
            <textarea
              className="pki-input min-h-[200px] font-mono text-xs"
              value={csr}
              onChange={(e) => setCsr(e.target.value)}
              placeholder="-----BEGIN CERTIFICATE REQUEST-----&#10;MIICpDCCAYwCAQAwYzELMAkGA1UEBhMCQ00xDjAM…&#10;-----END CERTIFICATE REQUEST-----"
            />
          </div>

          {/* Options */}
          <div className="pki-card p-6">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-emerald-500" />
                <span>Paramètres</span>
              </div>
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
                  <User size={13} className="mr-1 inline-block" />
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

            <div className="mt-5 flex items-center gap-3">
              <button
                className="btn btn-green"
                onClick={handleSign}
                disabled={loading || !csr.trim()}
              >
                <KeyRound size={15} />
                {loading ? 'Signature en cours...' : 'Signer la CSR'}
              </button>
              <button
                className="btn btn-primary"
                onClick={downloadCert}
                disabled={!certificate}
              >
                <Download size={14} />
                Télécharger le certificat
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right — result */}
        <div>
          <div className="pki-card p-5 h-full">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className={certificate ? 'text-emerald-500' : 'text-slate-400'} />
                <span>Certificat généré</span>
              </div>
              {certificate && <span className="status-badge status-active">Prêt</span>}
            </div>
            {certificate ? (
              <>
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <CheckCircle size={14} /> Certificat signé avec succès
                </div>
                <pre className="max-h-80 overflow-auto rounded-xl bg-slate-50 dark:bg-slate-800 p-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                  {certificate}
                </pre>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <KeyRound size={24} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">Aucun certificat généré.</p>
                <p className="mt-1 text-xs text-slate-400">Collez une CSR valide et cliquez sur Signer.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
