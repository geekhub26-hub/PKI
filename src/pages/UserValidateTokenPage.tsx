import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { AlertCircle, CheckCircle, Download, ArrowLeft, ShieldCheck, KeyRound, CalendarDays } from 'lucide-react';
import { userService } from '../services/api';

interface CertificateData {
  certificateId: string;
  certificate: string;
  fingerprint: string;
  issuedAt: string;
  expiresAt: string;
}

export default function UserValidateTokenPage() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  const requestId = searchParams.get('requestId');
  const token     = searchParams.get('token');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!requestId || !token) {
      setError('Paramètres manquants : requestId ou token');
      setLoading(false);
      return;
    }
    validateToken();
  }, [requestId, token, isAuthenticated]);

  const validateToken = async () => {
    try {
      setLoading(true); setError(null);
      const data = await userService.validateToken(requestId!, token!);
      setCertificate(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = () => {
    if (!certificate) return;
    const element = document.createElement('a');
    const file = new Blob([certificate.certificate], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `certificate-${certificate.certificateId}.pem`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">PKI ANTIC</p>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <ShieldCheck size={22} /> Validation du certificat
            </h1>
            <p className="mt-0.5 text-sm text-white/60">
              Validation du token et récupération sécurisée du certificat.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <ArrowLeft size={14} /> Retour
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="pki-card p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">Validation en cours…</p>
              <p className="mt-1 text-sm text-slate-500">Vérification du token et récupération du certificat.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="pki-card p-6">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Erreur de validation</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Aller au tableau de bord
          </button>
        </div>
      )}

      {/* Success state */}
      {success && certificate && !loading && (
        <div className="space-y-5">
          {/* Success banner */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle size={18} className="shrink-0" />
            Certificat validé avec succès.
          </div>

          {/* Certificate details */}
          <div className="pki-card p-6">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>Informations du certificat</span>
              </div>
              <span className="status-badge status-active">Valide</span>
            </div>

            <div className="info-row">
              <span className="info-row-label"><KeyRound size={12} /> ID certificat</span>
              <span className="info-row-value font-mono text-xs">{certificate.certificateId}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><ShieldCheck size={12} /> Empreinte</span>
              <span className="info-row-value font-mono text-xs break-all">{certificate.fingerprint}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><CalendarDays size={12} /> Délivré le</span>
              <span className="info-row-value">
                {new Date(certificate.issuedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="info-row" style={{ borderBottom: 'none' }}>
              <span className="info-row-label"><CalendarDays size={12} /> Expire le</span>
              <span className="info-row-value">
                {new Date(certificate.expiresAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={downloadCertificate} className="btn btn-green">
                <Download size={15} /> Télécharger le certificat (.pem)
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                Tableau de bord
              </button>
            </div>
          </div>

          {/* PEM preview */}
          <div className="pki-card p-5">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <KeyRound size={15} className="text-slate-500" />
                <span>Aperçu PEM</span>
              </div>
            </div>
            <pre className="max-h-40 overflow-auto rounded-xl bg-slate-50 dark:bg-slate-800 p-3 font-mono text-xs text-slate-600 dark:text-slate-300 break-words whitespace-pre-wrap">
              {certificate.certificate.substring(0, 200)}…
            </pre>
          </div>
        </div>
      )}

      {/* Footer info */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Connecté en tant que : <span className="font-semibold">{user?.email}</span>
      </p>
    </div>
  );
}
