import { useState } from 'react';
import Button from '../components/Button';
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
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          Signature CSR
        </div>
        <h1 className="text-h3 font-semibold text-[var(--text-1)]">Signer une CSR</h1>
        <p className="mt-2 text-sm text-[var(--text-3)]">
          Collez la CSR de l'utilisateur pour generer un certificat immediatement.
        </p>
      </header>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">CSR (PEM)</label>
        <textarea
          className="mt-2 min-h-[220px] w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm text-neutral-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:ring-primary-900"
          value={csr}
          onChange={(e) => setCsr(e.target.value)}
          placeholder="-----BEGIN CERTIFICATE REQUEST-----"
        />

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Validite (jours)</label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">ID utilisateur (optionnel)</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID utilisateur si besoin d'association"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleSign} disabled={loading || !csr.trim()}>Signer la CSR</Button>
          <Button variant="outline" onClick={downloadCert} disabled={!certificate}>Telecharger</Button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Certificat genere</div>
        {certificate ? (
          <pre className="max-h-96 overflow-auto rounded-lg bg-neutral-100 p-3 text-xs text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
            {certificate}
          </pre>
        ) : (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Aucun certificat genere.</div>
        )}
      </div>
    </div>
  );
}
