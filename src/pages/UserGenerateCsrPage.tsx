import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as tmImage from '@teachablemachine/image';
import {
  Camera, RefreshCw, CheckCircle, User, Building2,
  CreditCard, FileText, KeyRound, Upload, AlertTriangle, ScanFace,
} from 'lucide-react';
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
  const selfieUploadRef = useRef<HTMLInputElement | null>(null);
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

  // Auto-selfie state
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  const detectIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const captureScheduledRef = useRef(false);
  const detectCanvasRef = useRef<HTMLCanvasElement>(null);
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

  useEffect(() => { setStep(isCsrMode ? 3 : 1); }, [isCsrMode]);

  useEffect(() => {
    let cancelled = false;
    const loadModel = async () => {
      setAiStatus('loading'); setAiError(null);
      try {
        const model = await tmImage.load('/ai/id-model/model.json', '/ai/id-model/metadata.json');
        if (cancelled) return;
        setAiModel(model); setAiStatus('ready');
      } catch {
        if (cancelled) return;
        setAiStatus('error');
        setAiError("Le modèle IA n'a pas pu être chargé.");
      }
    };
    loadModel();
    return () => { cancelled = true; };
  }, []);

  const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

  const loadImage = (file: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image invalide')); };
      img.src = url;
    });

  const validateWithAi = async (file: File) => {
    if (!aiModel) throw new Error('Modèle non disponible');
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
      if (rejected.length) setError(`Format non pris en charge: ${rejected.join(', ')}`);

      const reqId = ++aiRequestIdRef.current;
      const nextResults: Record<string, { label: string; score: number; ok: boolean }> = {};
      const accepted: File[] = [];
      const invalid: string[] = [];

      for (const file of allowed) {
        if (file.type === 'application/pdf') {
          nextResults[fileKey(file)] = { label: 'PDF', score: 1, ok: true };
          accepted.push(file); continue;
        }
        if (aiStatus !== 'ready' || !aiModel) {
          invalid.push(`${file.name} (modèle IA indisponible)`); continue;
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

      if (reqId !== aiRequestIdRef.current) return;
      setAiResults((prev) => ({ ...prev, ...nextResults }));
      if (invalid.length) {
        setError(`Seules les pièces CNI/Passeport sont acceptées. Fichiers non valides: ${invalid.join(', ')}`);
      }
      setFiles((prev) => [...prev, ...accepted].slice(0, 5));
    },
    [aiModel, aiStatus]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); },
    [onFiles]
  );

  const onBrowse = () => fileInputRef.current?.click();

  const startCamera = async () => {
    setCameraError(null); setVideoReady(false);
    const constraintsList = [
      { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } },
      { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
      { video: true },
    ];
    for (const constraints of constraintsList) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setCameraActive(true);
        return;
      } catch (err: any) {
        const name: string = err?.name || '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraError("Accès refusé. Cliquez sur l'icône 🔒 dans la barre d'adresse du navigateur → autorisez la caméra → rechargez la page. Ou uploadez une photo ci-dessous.");
          return;
        }
        if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setCameraError("Aucune caméra détectée sur cet appareil. Uploadez une photo de selfie ci-dessous.");
          return;
        }
        // OverconstrainedError / NotReadableError → on essaie les contraintes suivantes
      }
    }
    setCameraError("La caméra est inaccessible. Elle est peut-être utilisée par une autre application (Zoom, Teams…). Fermez-les et réessayez, ou uploadez une photo de selfie ci-dessous.");
  };

  const onSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
    const url = URL.createObjectURL(f);
    setSelfieFile(f);
    setSelfiePreviewUrl(url);
    setCameraError(null);
    if (selfieUploadRef.current) selfieUploadRef.current.value = '';
  };

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Start face detection once video is playing
  useEffect(() => {
    if (cameraActive && videoReady) {
      startFaceDetection();
    } else {
      stopDetection();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, videoReady]);

  // ── Face detection helpers ────────────────────────────────────────────────

  const stopDetection = () => {
    if (detectIntervalRef.current !== null) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    captureScheduledRef.current = false;
    setFaceDetected(false);
    setCaptureCountdown(null);
  };

  const stopCamera = () => {
    stopDetection();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false); setVideoReady(false);
  };

  // Sample centre pixels to detect a face-like presence (brightness + variance heuristic)
  const checkFrameHasFace = (): boolean => {
    const video = videoRef.current;
    const canvas = detectCanvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || !videoReady) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const W = video.videoWidth;
    const H = video.videoHeight;
    canvas.width = W; canvas.height = H;
    ctx.drawImage(video, 0, 0, W, H);

    // Sample a 60×80 block in the centre (where the face guide oval is)
    const sx = Math.floor(W * 0.3), sy = Math.floor(H * 0.15);
    const sw = Math.floor(W * 0.4), sh = Math.floor(H * 0.55);
    const { data } = ctx.getImageData(sx, sy, sw, sh);
    const n = data.length / 4;
    if (n === 0) return false;

    let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
    r /= n; g /= n; b /= n;

    const brightness = (r + g + b) / 3;
    if (brightness < 45 || brightness > 235) return false; // too dark or blown-out

    // Very loose flesh-tone check: red channel dominant, not monochrome background
    const hasTone = r > 80 && (r - b) > 10 && Math.abs(r - g) < 80;
    return hasTone;
  };

  const startCountdown = () => {
    if (captureScheduledRef.current) return;
    captureScheduledRef.current = true;
    let tick = 3;
    setCaptureCountdown(tick);
    countdownIntervalRef.current = window.setInterval(() => {
      tick -= 1;
      if (tick <= 0) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        captureSelfie(); // auto-capture
      } else {
        setCaptureCountdown(tick);
      }
    }, 1000);
  };

  const startFaceDetection = () => {
    if (detectIntervalRef.current !== null) return;
    let consecutiveHits = 0;
    detectIntervalRef.current = window.setInterval(() => {
      const detected = checkFrameHasFace();
      setFaceDetected(detected);
      if (detected) {
        consecutiveHits++;
        if (consecutiveHits >= 2) startCountdown(); // 2 × 600 ms = 1.2 s of stable detection
      } else {
        consecutiveHits = 0;
        // Reset countdown if face lost before capture
        if (!captureScheduledRef.current) setCaptureCountdown(null);
      }
    }, 600);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    requestAnimationFrame(() => {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w; canvas.height = h;
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
        stopCamera(); // stopCamera calls stopDetection internally
      }, 'image/jpeg', 0.92);
    });
  };

  const retakeSelfie = () => {
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
    setSelfiePreviewUrl(null); setSelfieFile(null);
    startCamera();
  };

  useEffect(() => () => {
    stopCamera();
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelectCsrFile = (f: File | null) => {
    if (!f) { setCsrFile(null); return; }
    if (f.size > 200 * 1024) { setError('Fichier CSR trop volumineux (>200KB)'); return; }
    if (!(/\.pem$|\.csr$|text\/|application\/x-pem-file/.test(f.name) || /text\//.test(f.type))) {
      setError('Type de fichier CSR non pris en charge'); return;
    }
    setCsrFile(f); setError(null);
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      const removed = prev[idx];
      if (removed) {
        setAiResults((curr) => { const copy = { ...curr }; delete copy[fileKey(removed)]; return copy; });
      }
      return next;
    });
  const removeCsrFile = () => setCsrFile(null);

  const validatePersonalStep = () => {
    if (!firstName.trim()) return 'Le prénom est requis';
    if (!lastName.trim()) return 'Le nom est requis';
    if (!birthDate.trim()) return 'La date de naissance est requise';
    if (!birthPlace.trim()) return 'Le lieu de naissance est requis';
    if (!nationality.trim()) return 'La nationalité est requise';
    if (!identityDocumentType.trim()) return "Le type de pièce d'identité est requis";
    if (!identityDocumentNumber.trim()) return "Le numéro de pièce d'identité est requis";
    if (!identityDocumentExpiry.trim()) return "La date d'expiration de la pièce est requise";
    if (!emailAddr.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailAddr.trim())) return 'Un email valide est requis';
    if (!organization.trim()) return "L'organisation (O) est requise";
    if (!locality.trim()) return 'La ville (L) est requise';
    return null;
  };

  // CNI nécessite recto + verso — basé uniquement sur ce que l'IA a détecté dans les fichiers uploadés
  // (pas sur identityDocumentType qui vaut 'CNI' par défaut)
  const needsVerso = files.length > 0 &&
    files.some((f) => {
      const r = aiResults[fileKey(f)];
      return r?.ok && r.label.toLowerCase().includes('cni');
    });

  const validateIdentityStep = () => {
    if (files.length === 0) return "Veuillez ajouter au moins une pièce d'identité avant de continuer.";
    if (needsVerso && files.length < 2)
      return 'La CNI doit être soumise recto ET verso. Ajoutez la face arrière de la carte.';
    if (!selfieFile) return 'Veuillez ajouter un selfie pour la comparaison faciale.';
    return null;
  };

  const validateCertificateStep = () => {
    if (!commonName.trim()) return 'Le Common Name (CN) est requis';
    if (!organization.trim()) return "L'organisation (O) est requise";
    if (!locality.trim()) return 'La ville (L) est requise';
    if (!country.trim() || !/^[A-Za-z]{2}$/.test(country.trim())) return 'Le pays (C) doit être un code ISO 2 lettres';
    if (!emailAddr.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailAddr.trim())) return 'Un email valide est requis';
    if (csrModeChoice === 'paste' && !csrText.trim()) return 'Collez le CSR au format PEM.';
    if (csrModeChoice === 'upload' && !csrFile) return 'Ajoutez un fichier CSR.';
    return null;
  };

  const goNext = () => {
    setError(null);
    if (isCsrMode) return;
    if (step === 1) {
      const v = validatePersonalStep();
      if (v) { setError(v); return; }
      setStep(2); return;
    }
    if (step === 2) {
      const v = validateIdentityStep();
      if (v) { setError(v); return; }
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
        notify('success', 'CSR soumis avec succès. La demande repasse en vérification finale admin.');
        navigate('/requests');
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.response?.data?.error || 'Erreur lors de la soumission du CSR.');
      } finally { setSubmitting(false); }
      return;
    }

    const pv = validatePersonalStep();
    if (pv) return setError(pv);
    const iv = validateIdentityStep();
    if (iv) return setError(iv);

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
      notify('success', 'Demande soumise pour vérification admin.');
      navigate('/requests');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Erreur lors de la soumission.');
    } finally { setSubmitting(false); }
  };

  const onGenerateCsr = async () => {
    setError(null);
    if (!requestId) return setError('La génération CSR est disponible après création et validation admin de la demande.');
    const v = validateCertificateStep();
    if (v && v !== 'Collez le CSR au format PEM.' && v !== 'Ajoutez un fichier CSR.') return setError(v);
    setSubmitting(true);
    try {
      await userService.generateAndSubmitRequestCsr(requestId, {
        cn: commonName.trim(), o: organization.trim(),
        ou: organizationalUnit.trim() || undefined,
        l: locality.trim(), st: stateRegion.trim() || undefined,
        c: country.trim().toUpperCase(), email: emailAddr.trim() || undefined,
      });
      notify('success', 'CSR généré et soumis avec succès.');
      navigate('/requests');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Erreur lors de la génération du CSR.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Loading overlay — face comparison / submission */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-10 py-8 shadow-2xl dark:bg-slate-900 max-w-sm w-full mx-4 text-center">
            {/* Spinner */}
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanFace size={22} className="text-blue-500" />
              </div>
            </div>
            {selfieFile ? (
              <>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Comparaison faciale en cours…
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Le système vérifie que votre selfie correspond à votre pièce d'identité.
                  Cela peut prendre quelques secondes.
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Envoi de votre demande…
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Validation des documents en cours.
                </p>
              </>
            )}
            <div className="flex gap-1.5 pt-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header-bar">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">PKI ANTIC</p>
            <h1 className="text-2xl font-bold text-white">
              {isCsrMode ? 'Soumettre mon CSR' : 'Nouvelle demande de certificat'}
            </h1>
            <p className="mt-0.5 text-sm text-white/60">
              {isCsrMode
                ? 'Étape CSR — Demande validée par l\'administrateur'
                : `Étape ${step}/${lastStep} — ${
                    step === 1 ? 'Informations personnelles'
                    : step === 2 ? "Pièce d'identité et selfie"
                    : 'Entreprise et CSR'
                  }`}
            </p>
          </div>
          {/* Step badges */}
          <div className={`flex gap-2 ${isCsrMode ? '' : ''}`}>
            {!isCsrMode && (
              <>
                <StepBadge active={step === 1} done={step > 1} label="1. Personnel" />
                <StepBadge active={step === 2} done={false} label="2. Identité" />
                <StepBadge active={false} done={false} label="3. CSR" locked />
              </>
            )}
            {isCsrMode && <StepBadge active={step === 3} done={false} label="CSR autorisé" />}
          </div>
        </div>
      </div>

      {/* STEP 1 — Personal info */}
      {step === 1 && (
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <User size={15} className="text-blue-500" />
              <span>Informations personnelles</span>
            </div>
          </div>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Renseignez l'identité du demandeur. Ces informations seront comparées avec la pièce fournie à l'étape suivante.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Prénom *" value={firstName} onChange={setFirstName} placeholder="Japhet" />
            <Field label="Nom *" value={lastName} onChange={setLastName} placeholder="Fadil" />
            <Field label="Date de naissance *" value={birthDate} onChange={setBirthDate} placeholder="1995-01-31" type="date" />
            <Field label="Lieu de naissance *" value={birthPlace} onChange={setBirthPlace} placeholder="Yaoundé" />
            <Field label="Nationalité * (code 2 lettres)" value={nationality} onChange={(v) => setNationality(v.toUpperCase().slice(0, 2))} placeholder="CM" help="Ex: CM, FR, US" />
            <Field label="Email *" value={emailAddr} onChange={setEmailAddr} placeholder="japhet.fadil@organisation.cm" wide />
            <Field label="Type de pièce *" value={identityDocumentType} onChange={(v) => setIdentityDocumentType(v.toUpperCase())} placeholder="CNI ou PASSPORT" />
            <Field label="Numéro de pièce *" value={identityDocumentNumber} onChange={setIdentityDocumentNumber} placeholder="123456789" />
            <Field label="Expiration de la pièce *" value={identityDocumentExpiry} onChange={setIdentityDocumentExpiry} placeholder="2030-12-31" type="date" />
            <Field label="Organisation (O) *" value={organization} onChange={setOrganization} placeholder="Ministère de l'Intérieur" help="Votre organisation ou employeur" />
            <Field label="Ville (L) *" value={locality} onChange={setLocality} placeholder="Yaoundé" />
          </div>
        </div>
      )}

      {/* STEP 2 — Identity docs + selfie */}
      {step === 2 && (
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-amber-500" />
              <span>Pièce d'identité et selfie</span>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              aiStatus === 'ready' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : aiStatus === 'loading' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
            }`}>
              IA {aiStatus === 'loading' ? 'chargement…' : aiStatus === 'ready' ? 'active' : 'indisponible'}
              {aiError ? ` (${aiError})` : ''}
            </span>
          </div>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Importez votre pièce d'identité. <strong className="text-slate-700 dark:text-slate-200">CNI : recto + verso obligatoires.</strong>{' '}
            Passeport : page photo suffisante. Puis prenez un selfie — votre visage sera comparé à la pièce.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={onBrowse}
            className={`mb-5 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
              dragOver
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-blue-400 dark:hover:bg-slate-800/30'
            }`}
          >
            <Upload size={28} className="mx-auto mb-3 text-slate-400" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              ou cliquez pour sélectionner — PNG, JPEG, PDF (max 5 fichiers)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
              accept="image/png,image/jpeg,application/pdf"
            />
          </div>

          {/* Files list */}
          {files.length > 0 && (
            <div className="mb-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Pièces ajoutées ({files.length}{needsVerso ? '/2 requis' : ''})
              </p>
              {files.map((f, idx) => {
                const ai = aiResults[fileKey(f)];
                const isCni = needsVerso || ai?.label.toLowerCase().includes('cni');
                const sideLabel = isCni ? (idx === 0 ? 'RECTO' : 'VERSO') : null;
                return (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText size={14} className="shrink-0 text-slate-400" />
                      {sideLabel && (
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          idx === 0
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                        }`}>
                          {sideLabel}
                        </span>
                      )}
                      <span className="truncate text-sm text-slate-700 dark:text-slate-300">{f.name}</span>
                      <span className="text-xs text-slate-400">({Math.round(f.size / 1024)} KB)</span>
                      {ai && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          ai.ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                               : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {ai.label} — {Math.round(ai.score * 100)}%
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="ml-3 shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Supprimer
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bannière verso CNI */}
          {needsVerso && files.length === 1 && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  CNI détectée — verso requis
                </p>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                  La carte nationale d'identité doit être soumise des deux côtés.
                  Ajoutez une photo de la <strong>face arrière</strong> en cliquant sur la zone ci-dessus.
                </p>
              </div>
            </div>
          )}

          {/* Confirmation recto-verso complète */}
          {needsVerso && files.length >= 2 && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/30">
              <CheckCircle size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                CNI recto + verso fournis
              </p>
            </div>
          )}

          {/* Canvases hidden — capture + face detection */}
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={detectCanvasRef} className="hidden" />

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <Camera size={15} className="text-blue-500" />
                <span>Selfie en direct *</span>
              </div>
              {selfieFile && <span className="status-badge status-active">Capturé</span>}
            </div>

            {/* Indicateur de comparaison faciale */}
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/40 dark:bg-blue-950/30">
              <ScanFace size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Comparaison faciale automatique</p>
                <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
                  Votre selfie sera comparé au visage sur votre pièce d'identité par le système.
                  Regardez bien la caméra, visage face à l'objectif, sans lunettes ni masque.
                </p>
              </div>
            </div>

            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Prenez un selfie avec votre caméra. Veillez à ce que votre visage soit bien éclairé et centré.
            </p>

            {!cameraActive && !selfiePreviewUrl && (
              <button type="button" onClick={startCamera} className="btn btn-primary">
                <Camera size={14} /> Activer la caméra
              </button>
            )}

            {cameraError && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-red-600 dark:text-red-400">{cameraError}</p>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    Alternative — uploadez une photo de selfie :
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    ref={selfieUploadRef}
                    onChange={onSelfieUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => selfieUploadRef.current?.click()}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Upload size={14} /> Choisir une photo de selfie
                  </button>
                </div>
              </div>
            )}

            {cameraActive && (
              <div className="space-y-3">
                {/* Video + oval overlay */}
                <div className="relative inline-block w-full max-w-sm">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    onCanPlay={() => setVideoReady(true)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 scale-x-[-1]"
                  />

                  {/* Oval face guide */}
                  {videoReady && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className={`h-48 w-36 rounded-[50%] border-4 transition-all duration-300 ${
                        captureCountdown !== null
                          ? 'border-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.3)]'
                          : faceDetected
                            ? 'border-emerald-400'
                            : 'border-white/70'
                      }`} />
                    </div>
                  )}

                  {/* Status badge */}
                  {videoReady && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                      {captureCountdown !== null ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                          <Camera size={14} /> Capture dans {captureCountdown}…
                        </span>
                      ) : faceDetected ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-4 py-1.5 text-sm font-semibold text-white shadow">
                          <CheckCircle size={14} /> Visage détecté
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white shadow">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                          Positionnez votre visage dans l'ovale
                        </span>
                      )}
                    </div>
                  )}

                  {/* Loading overlay before video ready */}
                  {!videoReady && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/60">
                      <span className="text-sm text-white">Initialisation caméra…</span>
                    </div>
                  )}
                </div>

                <button type="button" onClick={stopCamera} className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline">
                  Annuler
                </button>
              </div>
            )}

            {selfiePreviewUrl && (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={selfiePreviewUrl}
                    alt="Selfie capturé"
                    className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700"
                  />
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                    <CheckCircle size={12} /> Selfie capturé
                  </span>
                </div>
                <button type="button" onClick={retakeSelfie} className="btn btn-primary">
                  <RefreshCw size={14} /> Reprendre
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3 — CSR */}
      {step === 3 && isCsrMode && (
        <div className="pki-card p-6">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-emerald-500" />
              <span>Entreprise et CSR</span>
            </div>
          </div>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Renseignez les informations du certificat, puis fournissez le CSR par saisie, fichier ou génération automatique.
          </p>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Common Name (CN) *" value={commonName} onChange={setCommonName} placeholder="Japhet Fadil" help="Nom qui apparaîtra sur le certificat" />
            <Field label="Organisation (O) *" value={organization} onChange={setOrganization} placeholder="Ministère de l'Intérieur" />
            <Field label="Unité Organisationnelle (OU)" value={organizationalUnit} onChange={setOrganizationalUnit} placeholder="Direction des Systèmes d'Information" />
            <Field label="Ville (L) *" value={locality} onChange={setLocality} placeholder="Yaoundé" />
            <Field label="Région / État (ST)" value={stateRegion} onChange={setStateRegion} placeholder="Centre" />
            <Field label="Pays (C) *" value={country} onChange={(v) => setCountry(v.toUpperCase())} placeholder="CM" help="Code pays ISO 3166-1 (2 lettres)" />
            <Field label="Email certificat *" value={emailAddr} onChange={setEmailAddr} placeholder="japhet.fadil@organisation.cm" wide />
          </div>

          {/* CSR mode choice */}
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ChoiceButton active={csrModeChoice === 'paste'} onClick={() => setCsrModeChoice('paste')} label="Écrire le CSR" icon={<FileText size={14} />} />
            <ChoiceButton active={csrModeChoice === 'upload'} onClick={() => setCsrModeChoice('upload')} label="Téléverser un CSR" icon={<Upload size={14} />} />
            <ChoiceButton active={csrModeChoice === 'generateLater'} onClick={() => setCsrModeChoice('generateLater')} label="Générer automatiquement" icon={<KeyRound size={14} />} />
          </div>

          {csrModeChoice === 'paste' && (
            <textarea
              className="pki-input min-h-[160px] font-mono text-xs"
              value={csrText}
              onChange={(e) => setCsrText(e.target.value)}
              placeholder={'-----BEGIN CERTIFICATE REQUEST-----\n…\n-----END CERTIFICATE REQUEST-----'}
            />
          )}

          {csrModeChoice === 'upload' && (
            <div className="flex items-center gap-3">
              <input
                ref={csrFileRef}
                type="file"
                className="hidden"
                accept=".csr,.pem,text/*"
                onChange={(e) => onSelectCsrFile(e.target.files ? e.target.files[0] : null)}
              />
              <button className="btn btn-primary" onClick={() => csrFileRef.current?.click()}>
                <Upload size={14} />
                {csrFile ? 'Remplacer' : 'Choisir un fichier CSR'}
              </button>
              {csrFile && (
                <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  {csrFile.name}
                  <button className="text-rose-600 hover:text-rose-800 text-xs font-semibold" onClick={removeCsrFile}>
                    Supprimer
                  </button>
                </span>
              )}
            </div>
          )}

          {csrModeChoice === 'generateLater' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
              {isCsrMode
                ? 'La demande est validée : vous pouvez générer le CSR automatiquement avec les informations ci-dessus.'
                : "La génération automatique sera disponible après validation admin."}
              {isCsrMode && (
                <div className="mt-3">
                  <button className="btn btn-green" onClick={onGenerateCsr} disabled={submitting}>
                    <KeyRound size={14} />
                    {submitting ? 'Génération…' : 'Générer et soumettre le CSR'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CGU */}
      {step === lastStep && (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4">
          <input
            id="cgu"
            type="checkbox"
            checked={cguAccepted}
            onChange={(e) => setCguAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 accent-emerald-600"
          />
          <label htmlFor="cgu" className="cursor-pointer text-sm text-slate-600 dark:text-slate-400">
            J'ai lu et j'accepte les{' '}
            <Link to="/conditions-generales" target="_blank" className="font-semibold text-blue-700 underline hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">Conditions Générales d'Utilisation</Link>{' '}
            et la{' '}
            <Link to="/politique-confidentialite" target="_blank" className="font-semibold text-blue-700 underline hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">Politique de Confidentialité</Link>{' '}
            de la plateforme ANTIC PKI.
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex flex-wrap justify-end gap-3">
        <button
          className="rounded-xl border-2 border-slate-300 dark:border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800/30"
          onClick={() => navigate('/dashboard')}
        >
          Annuler
        </button>
        {step > 1 && !isCsrMode && (
          <button className="btn btn-primary" onClick={goPrevious} disabled={submitting}>
            ← Précédent
          </button>
        )}
        {step < lastStep ? (
          <button className="btn btn-green" onClick={goNext} disabled={submitting}>
            Suivant →
          </button>
        ) : (
          <button
            className="btn btn-green disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onSubmit}
            disabled={submitting || !cguAccepted}
          >
            <CheckCircle size={15} />
            {submitting
              ? (selfieFile ? 'Comparaison faciale…' : 'Envoi…')
              : isCsrMode ? 'Soumettre le CSR' : 'Soumettre pour vérification'}
          </button>
        )}
      </div>
    </div>
  );
}

function StepBadge({ label, active, done, locked = false }: { label: string; active: boolean; done: boolean; locked?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-1.5 text-center text-xs font-bold ${
      locked
        ? 'border-slate-200 bg-slate-100/50 text-slate-400 opacity-60 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500'
        : done
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
          : active
            ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300'
            : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
    }`}>
      {locked ? '🔒 ' : ''}{label}
    </div>
  );
}

function ChoiceButton({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/30'
      }`}
      onClick={onClick}
    >
      {icon} {label}
    </button>
  );
}

function Field({
  label, value, onChange, placeholder, help, type = 'text', wide = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; help?: string; type?: string; wide?: boolean;
}) {
  return (
    <div className={`flex flex-col ${wide ? 'md:col-span-2' : ''}`}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <input
        type={type}
        className="pki-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {help && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{help}</p>}
    </div>
  );
}
