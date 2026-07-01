import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as tmImage from '@teachablemachine/image';
import { Camera, RefreshCw, CheckCircle } from 'lucide-react';
import { userService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { notify } from '../utils/notify';

export default function UserGenerateCsrPage() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('id');
  const mode = searchParams.get('mode') || 'new';
  const isCsrMode = mode === 'csr' && !!requestId;
  const lastStep = isCsrMode ? 3 : 2;
  const [step, setStep] = useState<1 | 2 | 3>(() => (isCsrMode ? 3 : 1));
  const [files, setFiles] = useState<File[]>([]);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [birthPlace, setBirthPlace] = useState<string>('');
  const [nationality, setNationality] = useState<string>('CM');
  const [identityDocumentType, setIdentityDocumentType] = useState<string>('CNI');
  const [identityDocumentNumber, setIdentityDocumentNumber] = useState<string>('');
  const [identityDocumentExpiry, setIdentityDocumentExpiry] = useState<string>('');
  const [commonName, setCommonName] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [organizationalUnit, setOrganizationalUnit] = useState<string>('');
  const [locality, setLocality] = useState<string>('');
  const [stateRegion, setStateRegion] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [emailAddr, setEmailAddr] = useState<string>('');
  const [csrModeChoice, setCsrModeChoice] = useState<'paste' | 'upload' | 'generateLater'>('paste');
  const [cguAccepted, setCguAccepted] = useState(false);
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
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setCommonName(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
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

  const startCamera = async () => {
    setCameraError(null);
    setVideoReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      // Ne pas assigner srcObject ici — on attend que le <video> soit dans le DOM (useEffect ci-dessous)
      setCameraActive(true);
    } catch {
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions du navigateur.");
    }
  };

  // Assigne srcObject après que <video> est rendu dans le DOM
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setVideoReady(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // requestAnimationFrame garantit qu'on capture après que le navigateur a rendu un vrai frame
    requestAnimationFrame(() => {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
        setSelfieFile(file);
        setSelfiePreviewUrl(url);
        stopCamera();
      }, 'image/jpeg', 0.92);
    });
  };

  const retakeSelfie = () => {
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
    setSelfiePreviewUrl(null);
    setSelfieFile(null);
    startCamera();
  };

  useEffect(() => () => {
    stopCamera();
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const validatePersonalStep = () => {
    if (!firstName.trim()) return 'Le prenom est requis';
    if (!lastName.trim()) return 'Le nom est requis';
    if (!birthDate.trim()) return 'La date de naissance est requise';
    if (!birthPlace.trim()) return 'Le lieu de naissance est requis';
    if (!nationality.trim()) return 'La nationalite est requise';
    if (!identityDocumentType.trim()) return "Le type de piece d'identite est requis";
    if (!identityDocumentNumber.trim()) return "Le numero de piece d'identite est requis";
    if (!identityDocumentExpiry.trim()) return "La date d'expiration de la piece est requise";
    if (!emailAddr.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailAddr.trim())) return 'Un email valide est requis';
    if (!organization.trim()) return "L'organisation (O) est requise";
    if (!locality.trim()) return 'La ville (L) est requise';
    return null;
  };

  const validateIdentityStep = () => {
    if (files.length === 0) return "Veuillez ajouter au moins une piece d'identite avant de continuer.";
    if (!selfieFile) return 'Veuillez ajouter un selfie pour la comparaison.';
    return null;
  };

  const validateCertificateStep = () => {
    if (!commonName.trim()) return 'Le Common Name (CN) est requis';
    if (!organization.trim()) return "L'organisation (O) est requise";
    if (!locality.trim()) return 'La ville (L) est requise';
    if (!country.trim() || !/^[A-Za-z]{2}$/.test(country.trim())) return 'Le pays (C) doit etre un code ISO 2 lettres';
    if (!emailAddr.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailAddr.trim())) return 'Un email valide est requis';
    if (csrModeChoice === 'paste' && !csrText.trim()) return 'Collez le CSR au format PEM.';
    if (csrModeChoice === 'upload' && !csrFile) return 'Ajoutez un fichier CSR.';
    return null;
  };

  const goNext = () => {
    setError(null);
    if (isCsrMode) return;
    if (step === 1) {
      const validation = validatePersonalStep();
      if (validation) {
        setError(validation);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const validation = validateIdentityStep();
      if (validation) {
        setError(validation);
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
      if (csrModeChoice === 'generateLater') return onGenerateCsr();
      if (csrModeChoice === 'paste' && !csrText.trim()) return setError('Collez le CSR au format PEM.');
      if (csrModeChoice === 'upload' && !csrFile) return setError('Ajoutez un fichier CSR.');

      setSubmitting(true);
      try {
        const form = new FormData();
        if (csrModeChoice === 'paste' && csrText.trim()) form.append('csr', csrText.trim());
        else if (csrModeChoice === 'upload' && csrFile) form.append('csrFile', csrFile);
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

    const personalValidation = validatePersonalStep();
    if (personalValidation) return setError(personalValidation);
    const identityValidation = validateIdentityStep();
    if (identityValidation) return setError(identityValidation);

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('firstName', firstName.trim());
      form.append('lastName', lastName.trim());
      form.append('birthDate', birthDate);
      form.append('birthPlace', birthPlace.trim());
      form.append('nationality', nationality.trim());
      form.append('identityDocumentType', identityDocumentType.trim());
      form.append('identityDocumentNumber', identityDocumentNumber.trim());
      form.append('identityDocumentExpiry', identityDocumentExpiry);
      form.append('commonName', commonName);
      form.append('organization', organization || '');
      form.append('organizationalUnit', organizationalUnit || '');
      form.append('locality', locality || '');
      form.append('state', stateRegion || '');
      form.append('country', country || '');
      form.append('email', emailAddr || '');
      files.forEach((f) => form.append('documents', f));
      if (selfieFile) form.append('selfie', selfieFile);
      if (csrModeChoice === 'paste' && csrText.trim()) form.append('csr', csrText.trim());
      else if (csrModeChoice === 'upload' && csrFile) form.append('csrFile', csrFile);
      await userService.submitCertificateRequest(form);
      notify('success', 'Demande soumise pour verification admin.');
      navigate('/requests');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  };

  const onGenerateCsr = async () => {
    setError(null);
    if (!requestId) return setError('La generation CSR est disponible apres creation et validation admin de la demande.');
    const validation = validateCertificateStep();
    if (validation && validation !== 'Collez le CSR au format PEM.' && validation !== 'Ajoutez un fichier CSR.') {
      return setError(validation);
    }
    setSubmitting(true);
    try {
      await userService.generateAndSubmitRequestCsr(requestId, {
        cn: commonName.trim(),
        o: organization.trim(),
        ou: organizationalUnit.trim() || undefined,
        l: locality.trim(),
        st: stateRegion.trim() || undefined,
        c: country.trim().toUpperCase(),
        email: emailAddr.trim() || undefined,
      });
      notify('success', 'CSR genere et soumis avec succes.');
      navigate('/requests');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Erreur lors de la generation du CSR.');
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
                : `Etape ${step}/${lastStep} - ${
                    step === 1 ? 'Informations personnelles' : step === 2 ? "Piece d'identite et selfie" : 'Entreprise et CSR'
                  }`}
            </div>
          </div>
          <div className={`grid gap-2 ${isCsrMode ? 'grid-cols-1' : 'grid-cols-3'}`}>
            {!isCsrMode && <StepBadge active={step === 1} done={step > 1} label="1. Personnel" />}
            {!isCsrMode && <StepBadge active={step === 2} done={false} label="2. Identité & docs" />}
            {!isCsrMode && <StepBadge active={false} done={false} label="3. CSR (admin requis)" locked />}
            {isCsrMode && <StepBadge active={step === 3} done={false} label="CSR autorisé" />}
          </div>
        </div>
      </header>

      {step === 1 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-h3 font-semibold dark:text-neutral-100">Informations personnelles</h2>
          <div className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            Renseignez l'identite du demandeur. Ces informations seront comparees avec la piece fournie a l'etape suivante.
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Prenom *" value={firstName} onChange={setFirstName} placeholder="Japhet" />
            <Field label="Nom *" value={lastName} onChange={setLastName} placeholder="Fadil" />
            <Field label="Date de naissance *" value={birthDate} onChange={setBirthDate} placeholder="1995-01-31" type="date" />
            <Field label="Lieu de naissance *" value={birthPlace} onChange={setBirthPlace} placeholder="Yaounde" />
            <Field label="Nationalite * (code 2 lettres)" value={nationality} onChange={(v) => setNationality(v.toUpperCase().slice(0, 2))} placeholder="CM" help="Ex: CM, FR, US" />
            <Field label="Email *" value={emailAddr} onChange={setEmailAddr} placeholder="japhet.fadil@organisation.fr" wide />
            <Field label="Type de piece *" value={identityDocumentType} onChange={(v) => setIdentityDocumentType(v.toUpperCase())} placeholder="CNI ou PASSPORT" />
            <Field label="Numero de piece *" value={identityDocumentNumber} onChange={setIdentityDocumentNumber} placeholder="123456789" />
            <Field label="Expiration de la piece *" value={identityDocumentExpiry} onChange={setIdentityDocumentExpiry} placeholder="2030-12-31" type="date" />
            <Field label="Organisation (O) *" value={organization} onChange={setOrganization} placeholder="Ministere de l'Interieur" help="Votre organisation ou employeur" />
            <Field label="Ville (L) *" value={locality} onChange={setLocality} placeholder="Yaounde" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-2 text-h3 font-semibold dark:text-neutral-100">Piece d'identite et selfie</h2>
          <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            Importez votre piece d'identite, puis ajoutez un selfie clair du demandeur pour la comparaison.
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
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Pieces ajoutees</div>
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

          {/* Webcam selfie */}
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
            <div className="mb-1 font-semibold dark:text-neutral-100">Selfie en direct *</div>
            <div className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
              Prenez un selfie avec votre caméra. Votre visage sera comparé à celui de votre pièce d'identité.
            </div>

            {!cameraActive && !selfiePreviewUrl && (
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
              >
                <Camera size={16} /> Activer la caméra
              </button>
            )}

            {cameraError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{cameraError}</p>
            )}

            {cameraActive && (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  onCanPlay={() => setVideoReady(true)}
                  className="w-full max-w-sm rounded-xl border border-neutral-200 dark:border-neutral-700 scale-x-[-1]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={captureSelfie}
                    disabled={!videoReady}
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera size={15} /> {videoReady ? 'Prendre le selfie' : 'Initialisation…'}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {selfiePreviewUrl && (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={selfiePreviewUrl}
                    alt="Selfie capturé"
                    className="w-full max-w-sm rounded-xl border border-neutral-200 dark:border-neutral-700"
                  />
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                    <CheckCircle size={12} /> Selfie capturé
                  </span>
                </div>
                <button
                  type="button"
                  onClick={retakeSelfie}
                  className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                >
                  <RefreshCw size={14} /> Reprendre
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && isCsrMode && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-2 text-h3 font-semibold dark:text-neutral-100">Entreprise et CSR</h2>
          <div className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            Renseignez les informations du certificat, puis fournissez le CSR par saisie, fichier ou generation apres validation admin.
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Common Name (CN) *" value={commonName} onChange={setCommonName} placeholder="Japhet Fadil" help="Nom qui apparaitra sur le certificat" />
            <Field label="Organisation (O) *" value={organization} onChange={setOrganization} placeholder="Ministere de l'Interieur" />
            <Field label="Unite Organisationnelle (OU)" value={organizationalUnit} onChange={setOrganizationalUnit} placeholder="Direction des Systemes d'Information" />
            <Field label="Ville (L) *" value={locality} onChange={setLocality} placeholder="Yaounde" />
            <Field label="Region / Etat (ST)" value={stateRegion} onChange={setStateRegion} placeholder="Centre" />
            <Field label="Pays (C) *" value={country} onChange={(v) => setCountry(v.toUpperCase())} placeholder="CM" help="Code pays ISO 3166-1 (2 lettres)" />
            <Field label="Email certificat *" value={emailAddr} onChange={setEmailAddr} placeholder="japhet.fadil@organisation.fr" wide />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            <ChoiceButton active={csrModeChoice === 'paste'} onClick={() => setCsrModeChoice('paste')} label="Ecrire le CSR" />
            <ChoiceButton active={csrModeChoice === 'upload'} onClick={() => setCsrModeChoice('upload')} label="Televerser un CSR" />
            <ChoiceButton active={csrModeChoice === 'generateLater'} onClick={() => setCsrModeChoice('generateLater')} label="Generer" />
          </div>

          {csrModeChoice === 'paste' && (
            <div className="mb-4">
              <textarea
                className="h-36 w-full rounded border bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                value={csrText}
                onChange={(e) => setCsrText(e.target.value)}
                placeholder={'-----BEGIN CERTIFICATE REQUEST-----\n...\n-----END CERTIFICATE REQUEST-----'}
              />
            </div>
          )}

          {csrModeChoice === 'upload' && (
            <div>
              <div className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Uploader un fichier CSR</div>
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
          )}

          {csrModeChoice === 'generateLater' && (
            <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900 dark:border-primary-900 dark:bg-primary-950/30 dark:text-primary-200">
              {isCsrMode
                ? 'La demande est validee: vous pouvez generer le CSR automatiquement avec les informations ci-dessus.'
                : "La generation automatique sera disponible apres validation admin. La demande partira d'abord en verification avec la piece et le selfie."}
              {isCsrMode && (
                <div className="mt-3">
                  <button className="rounded-lg bg-primary-800 px-4 py-2 font-semibold text-white" onClick={onGenerateCsr} disabled={submitting}>
                    Generer et soumettre le CSR
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === lastStep && (
        <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <input
            id="cgu"
            type="checkbox"
            checked={cguAccepted}
            onChange={(e) => setCguAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 accent-primary-600"
          />
          <label htmlFor="cgu" className="cursor-pointer text-sm text-neutral-600 dark:text-neutral-400">
            J'ai lu et j'accepte les{' '}
            <span className="font-semibold text-primary-700 dark:text-primary-400">Conditions Générales d'Utilisation</span>{' '}
            et la <span className="font-semibold text-primary-700 dark:text-primary-400">Politique de Confidentialité</span> de la plateforme ANTIC PKI.
          </label>
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
          <button
            className="rounded-lg bg-primary-800 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onSubmit}
            disabled={submitting || !cguAccepted}
          >
            {submitting ? 'Envoi...' : isCsrMode ? 'Soumettre le CSR' : 'Soumettre pour verification'}
          </button>
        )}
      </div>

      {error && <div className="mt-4 text-red-600 dark:text-red-300">{error}</div>}
    </div>
  );
}

function StepBadge({ label, active, done, locked = false }: { label: string; active: boolean; done: boolean; locked?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center text-sm font-semibold ${
        locked
          ? 'border-neutral-200 bg-neutral-50 text-neutral-400 opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500'
          : done
            ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300'
            : active
              ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/30 dark:text-primary-300'
              : 'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
      }`}
    >
      {locked ? '🔒 ' : ''}{label}
    </div>
  );
}

function ChoiceButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
        active
          ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/30 dark:text-primary-300'
          : 'border-neutral-200 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  help,
  type = 'text',
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  help?: string;
  type?: string;
  wide?: boolean;
}) {
  return (
    <label className={`flex flex-col ${wide ? 'md:col-span-2' : ''}`}>
      <span className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
      <input type={type} className="rounded border bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {help && <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{help}</div>}
    </label>
  );
}




