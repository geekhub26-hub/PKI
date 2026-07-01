import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { adminService } from '../services/api';

export default function AdminGenerateCaPage() {
  const [status, setStatus] = useState<any | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rootName, setRootName] = useState('PKI Souverain Root CA');
  const [rootLoading, setRootLoading] = useState(false);

  const [intermediateName, setIntermediateName] = useState('PKI Intermediate CA');
  const [keySize, setKeySize] = useState('4096');
  const [validityDays, setValidityDays] = useState('3650');
  const [intermediateLoading, setIntermediateLoading] = useState(false);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await adminService.getCAStatus();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleGenerateRoot = async () => {
    setError(null);
    if (!rootName.trim()) {
      setError("Le nom de l'AC racine est requis.");
      return;
    }
    setRootLoading(true);
    try {
      await adminService.generateRootCA(rootName.trim());
      await loadStatus();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Impossible de generer l'AC racine.");
    } finally {
      setRootLoading(false);
    }
  };

  const handleGenerateIntermediate = async () => {
    setError(null);
    const ks = Number(keySize);
    const vd = Number(validityDays);
    if (!intermediateName.trim()) {
      setError("Le nom de l'AC intermediaire est requis.");
      return;
    }
    if (![2048, 3072, 4096].includes(ks)) {
      setError('La taille de cle doit etre 2048, 3072 ou 4096.');
      return;
    }
    if (!Number.isFinite(vd) || vd < 30) {
      setError('La validite doit etre au moins 30 jours.');
      return;
    }
    setIntermediateLoading(true);
    try {
      await adminService.generateIntermediateCA({
        name: intermediateName.trim(),
        keySize: ks,
        validityDays: vd,
      });
      await loadStatus();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Impossible de generer l'AC intermediaire.");
    } finally {
      setIntermediateLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Générer Autorité de Certification</h1>
          <p className="mt-1 text-sm text-white/70">Créez la chaîne de certification et suivez l'état de l'AC active.</p>
        </div>
        <KeyRound size={32} className="text-white/80" />
      </div>

      {/* CA Status card */}
      <div className="pki-card p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">État CA active</h2>
        {loadingStatus ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">Chargement...</div>
        ) : status ? (
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Nom :</span> {status.caName || '-'}
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Active :</span>
              {status.isActive ? (
                <span className="status-badge status-active">Active</span>
              ) : (
                <span className="status-badge status-pending">Inactive</span>
              )}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Valide jusqu'au :</span> {status.validUntil || '-'}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Subject DN :</span> {status.subjectDN || '-'}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <span className="status-badge status-pending">Aucune CA active détectée.</span>
          </div>
        )}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AC Racine */}
        <div className="pki-card p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">AC Racine</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Nom AC racine
              </label>
              <input
                className="pki-input"
                value={rootName}
                onChange={(e) => setRootName(e.target.value)}
                placeholder="PKI Souverain Root CA"
              />
            </div>
            <button
              className="btn btn-green w-full"
              onClick={handleGenerateRoot}
              disabled={rootLoading}
            >
              {rootLoading ? 'Génération...' : 'Générer AC racine'}
            </button>
          </div>
        </div>

        {/* AC Intermédiaire */}
        <div className="pki-card p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">AC Intermédiaire</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Nom AC intermédiaire
              </label>
              <input
                className="pki-input"
                value={intermediateName}
                onChange={(e) => setIntermediateName(e.target.value)}
                placeholder="PKI Intermediate CA"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Taille clé
                </label>
                <input
                  className="pki-input"
                  value={keySize}
                  onChange={(e) => setKeySize(e.target.value)}
                  placeholder="4096"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Validité (jours)
                </label>
                <input
                  className="pki-input"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  placeholder="3650"
                />
              </div>
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={handleGenerateIntermediate}
              disabled={intermediateLoading}
            >
              {intermediateLoading ? 'Génération...' : 'Générer AC intermédiaire'}
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
