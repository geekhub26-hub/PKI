import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
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
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-h3 font-semibold text-[var(--text-1)]">Generer AC racine / intermediaire</h1>
        <p className="mt-1 text-sm text-[var(--text-3)]">Creez la chaine de certification et suivez l'etat de l'AC active.</p>
      </header>

      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-lg font-semibold dark:text-neutral-100">Etat CA active</h2>
        {loadingStatus ? (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Chargement...</div>
        ) : status ? (
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="dark:text-neutral-300"><span className="font-semibold">Nom:</span> {status.caName || '-'}</div>
            <div className="dark:text-neutral-300"><span className="font-semibold">Active:</span> {String(status.isActive)}</div>
            <div className="dark:text-neutral-300"><span className="font-semibold">Valide jusqu'au:</span> {status.validUntil || '-'}</div>
            <div className="dark:text-neutral-300"><span className="font-semibold">Subject DN:</span> {status.subjectDN || '-'}</div>
          </div>
        ) : (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Aucune CA active detectee.</div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-lg font-semibold dark:text-neutral-100">Generer AC racine</h2>
          <div className="space-y-4">
            <Input
              label="Nom AC racine"
              value={rootName}
              onChange={setRootName}
              placeholder="PKI Souverain Root CA"
            />
            <Button onClick={handleGenerateRoot} loading={rootLoading}>
              Generer AC racine
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-lg font-semibold dark:text-neutral-100">Generer AC intermediaire</h2>
          <div className="space-y-4">
            <Input
              label="Nom AC intermediaire"
              value={intermediateName}
              onChange={setIntermediateName}
              placeholder="PKI Intermediate CA"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Taille cle"
                value={keySize}
                onChange={setKeySize}
                placeholder="4096"
              />
              <Input
                label="Validite (jours)"
                value={validityDays}
                onChange={setValidityDays}
                placeholder="3650"
              />
            </div>
            <Button onClick={handleGenerateIntermediate} loading={intermediateLoading} variant="secondary">
              Generer AC intermediaire
            </Button>
          </div>
        </section>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
}
