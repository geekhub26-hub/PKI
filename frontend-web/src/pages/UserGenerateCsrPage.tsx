import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as tmImage from '@teachablemachine/image';
import { userService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { notify } from '../utils/notify';

export default function UserGenerateCsrPage() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('id');
  const mode = searchParams.get('mode') || 'new';
  const isCsrMode = mode === 'csr' && !!requestId;
  const lastStep: 2 | 3 = isCsrMode ? 3 : 2;
  const [step, setStep] = useState<1 | 2 | 3>(() => (isCsrMode ? 3 : 1));
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commonName, setCommonName] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [organizationalUnit, setOrganizationalUnit] = useState<string>('');
  const [locality, setLocality] = useState<string>('');
  const [stateRegion, setStateRegion] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [emailAddr, setEmailAddr] = useState<string>('');
  const [csrText, setCsrText] = useState<string>('');
  const [csrFile, setCsrFile] = useState<File | null>(null);
  const [aiModel, setAiModel] = useState<tmImage.CustomMobileNet | null>(null);
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Record<string, { label: string; score: number; ok: boolean }>>({});
  const aiRequestIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const csrFileRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setError(null);
    setCommonName(user?.firstName + ' ' + user?.lastName || '');
    setOrganization('');
    setEmailAddr(user?.email || '');
    setCountry('CM');
  }, [user]);

  useEffect(() => {
    setStep(isCsrMode ? 3 : 1);
  }, [isCsrMode]);

  useEffect(() => {
    let cancelled = false;
    const loadModel = async () => {
      setAiStatus('loading');
      setAiError(null);
      try {
        const model = await tmImage.load('/ai/id-model/model.json', '/ai/id-model/metadata.json');
        if (cancelled) return;
        setAiModel(model);
        setAiStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setAiStatus('error');
        setAiError("Le modele IA n'a pas pu etre charge.");
      }
    };
    loadModel();
    return () => {
      cancelled = true;
    };
  }, []);

  const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

  const loadImage = (file: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image invalide'));
      };
      img.src = url;
    });

  const validateWithAi = async (file: File) => {
    if (!aiModel) throw new Error('Modele non disponible');
    const img = await loadImage(file);
    const predictions: tmImage.Prediction[] = await aiModel.predict(img);
    const best = predictions.reduce<tmImage.Prediction>(
      (acc, cur) => (cur.probability > acc.probability ? cur : acc),
      predictions[0]
    );
    const label = best?.className || 'UNKNOWN';
    const score = best?.probability ?? 0;
    const normalized = label.toLowerCase();
    const isAllowed = ['cni', 'passport', 'passeport'].some((v) => normalized.includes(v));
    const ok = isAllowed && score >= 0.8;
    return { label, score, ok };
  };

  const onFiles = useCallback(
    async (selected: FileList | null) => {
      if (!selected) return;
      setError(null);
      const arr = Array.from(selected);
      const allowed = arr.filter((f) => /png|jpe?g|pdf/.test(f.type));
      const rejected = arr.filter((f) => !/png|jpe?g|pdf/.test(f.type)).map((f) => f.name);
      if (rejected.length) {
        setError(`Format non pris en charge: ${rejected.join(', ')}`);
      }

      const requestId = ++aiRequestIdRef.current;
      const nextResults: Record<string, { label: string; score: number; ok: boolean }> = {};
      const accepted: File[] = [];
      const invalid: string[] = [];

      for (const file of allowed) {
        if (file.type === 'application/pdf') {
          nextResults[fileKey(file)] = { label: 'PDF', score: 1, ok: true };
          accepted.push(file);
          continue;
        }
        if (aiStatus !== 'ready' || !aiModel) {
          invalid.push(`${file.name} (modele IA image indisponible)`);
          continue;
        }
        try {
          const result = await validateWithAi(file);
          nextResults[fileKey(file)] = result;
          if (result.ok) accepted.push(file);
          else invalid.push(file.name);
        } catch {
          nextResults[fileKey(file)] = { label: 'UNKNOWN', score: 0, ok: false };
          invalid.push(file.name);
        }
      }

      if (requestId !== aiRequestIdRef.current) return;
      setAiResults((prev) => ({ ...prev, ...nextResults }));
      if (invalid.length) {
        setError(`Seules les pieces d'identite CNI/Passeport sont acceptees. Fichiers non valides: ${invalid.join(', ')}`);
      }
      setFiles((prev) => [...prev, ...accepted].slice(0, 5));
    },
    [aiModel, aiStatus]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      onFiles(e.dataTransfer.files);
    },
    [onFiles]
  );

  const onBrowse = () => fileInputRef.current?.click();

  const onSelectCsrFile = (f: File | null) => {
    if (!f) {
      setCsrFile(null);
      return;
    }
    if (f.size > 200 * 1024) {
      setError('Fichier CSR trop volumineux (>200KB)');
      return;
    }
    if (!(/\.pem$|\.csr$|text\/|application\/x-pem-file/.test(f.name) || /text\//.test(f.type))) {
      setError('Type de fichier CSR non pris en charge');
      return;
    }
    setCsrFile(f);
    setError(null);
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      const removed = prev[idx];
      if (removed) {
        setAiResults((curr) => {
          const copy = { ...curr };
          delete copy[fileKey(removed)];
          return copy;
        });
      }
      return next;
    });
  const removeCsrFile = () => setCsrFile(null);

  const validateStep1 = () => {
    if (!commonName.trim()) return 'Le Common Name (CN) est requis';
    if (!organization.trim()) return "L'organisation (O) est requise";
    if (!locality.trim()) return 'La ville (L) est requise';
    if (!country.trim() || !/^[A-Za-z]{2}$/.test(country.trim())) return 'Le pays (C) doit etre un code ISO 2 lettres';
    if (!emailAddr.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailAddr.trim())) return 'Un email valide est requis';
    return null;
  };

  const goNext = () => {
    setError(null);
    if (isCsrMode) return;
    if (step === 1) {
      const validation = validateStep1();
      if (validation) {
        setError(validation);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (files.length === 0) {
        setError("Veuillez ajouter au moins une piece d'identite avant de continuer.");
        return;
      }
      setStep(3);
    }
  };

  const goPrevious = () => {
    setError(null);
    setStep((prev) => (prev === 1 ? 1 : ((prev - 1) as 1 | 2 | 3)));
  };

  const onSubmit = async () => {
    setError(null);
    if (isCsrMode) {
      if (!requestId) return setError('Demande introuvable pour soumettre le CSR.');
      if (!csrText.trim() && !csrFile) return setError('Un CSR (texte ou fichier) est requis.');

      setSubmitting(true);
      try {
        const form = new FormData();
        if (csrText.trim()) form.append('csr', csrText.trim());
        else if (csrFile) form.append('csrFile', csrFile);
        await userService.submitRequestCsr(requestId, form);
        notify('success', 'CSR soumis avec succes. La demande repasse en verification finale admin.');
        navigate('/requests');
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.response?.data?.error || 'Erreur lors de la soumission du CSR.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const validation = validateStep1();
    if (validation) return setError(validation);
    if (files.length === 0) return setError("Veuillez ajouter au moins une piece d'identite.");

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('commonName', commonName);
      form.append('organization', organization || '');
      form.append('organizationalUnit', organizationalUnit || '');
      form.append('locality', locality || '');
      form.append('state', stateRegion || '');
      form.append('country', country || '');
      form.append('email', emailAddr || '');
      files.forEach((f) => form.append('documents', f));
      await userService.submitCertificateRequest(form);
      notify('success', 'Demande soumise pour verification admin.');
      navigate('/requests');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-h3 font-semibold text-[var(--text-1)]">Nouvelle demande</h1>
            <div className="mt-1 text-sm text-[var(--text-3)]">
              {isCsrMode
                ? 'Etape CSR - Demande validee par admin'
                : `Etape ${step}/${lastStep} - ${step === 1 ? 'Informations du certificat' : "Piece d'identite"}`}
            </div>
          </div>
          <div className={`grid gap-2 ${isCsrMode ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {!isCsrMode && <StepBadge active={step === 1} done={step > 1} label="1. Formulaire" />}
            {!isCsrMode && <StepBadge active={step === 2} done={false} label="2. Identite" />}
            {isCsrMode && <StepBadge active={step === 3} done={false} label="CSR autorise" />}
          </div>
        </div>
      </header>

      {step === 1 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-h3 font-semibold dark:text-neutral-100">Informations du certificat</h2>
          <div className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            Remplissez les informations de votre certificat numerique. Tous les champs marques d'un asterisque sont obligatoires.
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Common Name (CN) *" value={commonName} onChange={setCommonName} placeholder="Japhet Fadil" help="Votre nom complet tel qu'il apparaitra sur le certificat" />
            <Field label="Organisation (O) *" value={organization} onChange={setOrganization} placeholder="Ministere de l'Interieur" />
            <Field label="Unite Organisationnelle (OU)" value={organizationalUnit} onChange={setOrganizationalUnit} placeholder="Direction des Systemes d'Information" />
            <Field label="Ville (L) *" value={locality} onChange={setLocality} placeholder="Yaounde" />
            <Field label="Region / Etat (ST)" value={stateRegion} onChange={setStateRegion} placeholder="Centre" />
            <Field label="Pays (C) *" value={country} onChange={(v) => setCountry(v.toUpperCase())} placeholder="CM" help="Code pays ISO 3166-1 (2 lettres)" />
            <Field label="Email *" value={emailAddr} onChange={setEmailAddr} placeholder="japhet.fadil@organisation.fr" wide />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-2 text-h3 font-semibold dark:text-neutral-100">Piece d'identite</h2>
          <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            Importez votre piece d'identite (CNI ou passeport). Images ou PDF sont acceptes.
          </div>
          <div className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
            IA navigateur: {aiStatus === 'loading' ? 'chargement du modele...' : aiStatus === 'ready' ? 'active pour images' : 'indisponible'}
            {aiError ? ` - ${aiError}` : ''}
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-lg border-2 p-12 text-center ${
              dragOver
                ? 'border-dashed border-primary-600 bg-primary-50 dark:bg-primary-950/30'
                : 'border-dashed border-neutral-300 dark:border-neutral-700'
            }`}
          >
            <div className="font-semibold dark:text-neutral-100">Glissez-deposez vos fichiers ici</div>
            <div className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
              ou{' '}
              <button className="text-primary-700 underline dark:text-primary-300" onClick={onBrowse}>
                cliquez pour selectionner
              </button>
            </div>
            <button onClick={onBrowse} className="mt-2 inline-block rounded-lg border-2 border-primary-700 px-4 py-2 text-primary-700 dark:border-primary-300 dark:text-primary-300">
              Parcourir les fichiers
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} accept="image/png,image/jpeg,application/pdf" />
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <ul className="space-y-2">
                {files.map((f, idx) => (
                  <li key={idx} className="flex items-center justify-between rounded bg-neutral-50 p-3 dark:bg-neutral-800">
                    <div className="text-sm dark:text-neutral-200">
                      {f.name} <span className="text-xs text-neutral-400 dark:text-neutral-500">({Math.round(f.size / 1024)} KB)</span>
                      {aiResults[fileKey(f)] && (
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                            aiResults[fileKey(f)].ok
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          {aiResults[fileKey(f)].label} - {Math.round(aiResults[fileKey(f)].score * 100)}%
                        </span>
                      )}
                    </div>
                    <button className="text-sm text-red-600" onClick={() => removeFile(idx)}>
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-2 text-h3 font-semibold dark:text-neutral-100">CSR (obligatoire)</h2>
          <div className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            Collez une CSR au format PEM ou uploadez un fichier CSR.
          </div>
          <div className="mb-4">
            <textarea
              className="h-36 w-full rounded border bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              value={csrText}
              onChange={(e) => setCsrText(e.target.value)}
              placeholder={'-----BEGIN CERTIFICATE REQUEST-----\n...\n-----END CERTIFICATE REQUEST-----'}
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">OU uploader un fichier CSR</div>
            <div className="flex items-center gap-3">
              <input ref={csrFileRef} type="file" className="hidden" accept=".csr,.pem,text/*" onChange={(e) => onSelectCsrFile(e.target.files ? e.target.files[0] : null)} />
              <button className="rounded border px-4 py-2 dark:border-neutral-700 dark:text-neutral-200" onClick={() => csrFileRef.current?.click()}>
                {csrFile ? 'Remplacer le fichier CSR' : 'Choisir un fichier CSR'}
              </button>
              {csrFile && (
                <div className="text-sm text-neutral-700 dark:text-neutral-300">
                  {csrFile.name}
                  <button className="ml-3 text-red-600" onClick={removeCsrFile}>
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <button className="rounded-lg border-2 border-primary-700 px-6 py-3 text-primary-700 dark:border-primary-300 dark:text-primary-300" onClick={() => navigate('/dashboard')}>
          Annuler
        </button>
        {step > 1 && !isCsrMode && (
          <button
            className="rounded-lg border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            onClick={goPrevious}
            disabled={submitting}
          >
            Precedent
          </button>
        )}
        {step < lastStep ? (
          <button
            className="rounded-lg bg-primary-800 px-6 py-3 font-semibold text-white"
            onClick={goNext}
            disabled={submitting}
          >
            Suivant
          </button>
        ) : (
          <button className="rounded-lg bg-primary-800 px-6 py-3 font-semibold text-white" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Envoi...' : isCsrMode ? 'Soumettre le CSR' : 'Soumettre pour verification'}
          </button>
        )}
      </div>

      {error && <div className="mt-4 text-red-600 dark:text-red-300">{error}</div>}
    </div>
  );
}

function StepBadge({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center text-sm font-semibold ${
        done
          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300'
          : active
            ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/30 dark:text-primary-300'
            : 'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
      }`}
    >
      {label}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  help,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  help?: string;
  wide?: boolean;
}) {
  return (
    <label className={`flex flex-col ${wide ? 'md:col-span-2' : ''}`}>
      <span className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
      <input className="rounded border bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {help && <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{help}</div>}
    </label>
  );
}




