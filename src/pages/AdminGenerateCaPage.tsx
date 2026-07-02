import { useEffect, useState } from 'react';
import { KeyRound, Building2, ShieldCheck } from 'lucide-react';
import { adminService } from '../services/api';

export default function AdminGenerateCaPage() {
  const [status, setStatus]           = useState<any | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [rootName, setRootName]       = useState('PKI Souverain Root CA');
  const [rootLoading, setRootLoading] = useState(false);

  const [intermediateName, setIntermediateName]   = useState('PKI Intermediate CA');
  const [keySize, setKeySize]                     = useState('4096');
  const [validityDays, setValidityDays]           = useState('3650');
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

  useEffect(() => { loadStatus(); }, []);

  const handleGenerateRoot = async () => {
    setError(null);
    if (!rootName.trim()) { setError("Le nom de l'AC racine est requis."); return; }
    setRootLoading(true);
    try {
      await adminService.generateRootCA(rootName.trim());
      await loadStatus();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Impossible de générer l'AC racine.");
    } finally {
      setRootLoading(false);
    }
  };

  const handleGenerateIntermediate = async () => {
    setError(null);
    const ks = Number(keySize);
    const vd = Number(validityDays);
    if (!intermediateName.trim()) { setError("Le nom de l'AC intermédiaire est requis."); return; }
    if (![2048, 3072, 4096].includes(ks)) { setError('La taille de clé doit être 2048, 3072 ou 4096.'); return; }
    if (!Number.isFinite(vd) || vd < 30) { setError('La validité doit être au moins 30 jours.'); return; }
    setIntermediateLoading(true);
    try {
      await adminService.generateIntermediateCA({ name: intermediateName.trim(), keySize: ks, validityDays: vd });
      await loadStatus();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Impossible de générer l'AC intermédiaire.");
    } finally {
      setIntermediateLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
            <h1 className="text-2xl font-bold text-white">Générer Autorité de Certification</h1>
            <p className="mt-0.5 text-sm text-white/60">
              Créez la chaîne de certification et suivez l'état de l'AC active.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <KeyRound size={24} className="text-white" />
          </div>
        </div>
      </div>

      {/* CA Status */}
      <div className="pki-card p-6">
        <div className="section-title">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-blue-500" />
            <span>État CA active</span>
          </div>
          {status?.isActive && <span className="status-badge status-active">Active</span>}
          {status && !status.isActive && <span className="status-badge status-pending">Inactive</span>}
        </div>

        {loadingStatus ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
            Chargement…
          </div>
        ) : status ? (
          <div>
            <div className="info-row">
              <span className="info-row-label"><Building2 size={12} /> Nom AC</span>
              <span className="info-row-value">{status.caName || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><ShieldCheck size={12} /> Subject DN</span>
              <span className="info-row-value text-xs font-mono">{status.subjectDN || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><KeyRound size={12} /> Valide jusqu'au</span>
              <span className="info-row-value">{status.validUntil || '—'}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
            Aucune CA active détectée.
          </div>
        )}
      </div>

      {/* Two-column: Root + Intermediate */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AC Racine */}
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-500" />
              <span>AC Racine</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
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
              <KeyRound size={15} />
              {rootLoading ? 'Génération...' : 'Générer AC racine'}
            </button>
          </div>
        </div>

        {/* AC Intermédiaire */}
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-blue-500" />
              <span>AC Intermédiaire</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
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
                  Taille clé (bits)
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
              <Building2 size={15} />
              {intermediateLoading ? 'Génération...' : 'Générer AC intermédiaire'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
