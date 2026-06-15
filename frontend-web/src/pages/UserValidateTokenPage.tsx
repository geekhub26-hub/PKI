import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { AlertCircle, CheckCircle, Download, ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface CertificateData {
  certificateId: string;
  certificate: string;
  fingerprint: string;
  issuedAt: string;
  expiresAt: string;
}

export default function UserValidateTokenPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  const requestId = searchParams.get('requestId');
  const token = searchParams.get('token');

  useEffect(() => {
    // Rediriger si non authentifiÃ©
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // VÃ©rifier les paramÃ¨tres
    if (!requestId || !token) {
      setError('ParamÃ¨tres manquants : requestId ou token');
      setLoading(false);
      return;
    }

    // Valider le token
    validateToken();
  }, [requestId, token, isAuthenticated]);

  const validateToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiBaseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';
      const authToken = localStorage.getItem('accessToken');
      
      const response = await axios.post<CertificateData>(
        `${apiBaseUrl}/user/certificate-requests/${requestId}/validate-token`,
        null,
        {
          params: { token },
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      setCertificate(response.data);
      setSuccess(true);
    } catch (err: any) {
      console.error('Erreur lors de la validation du token:', err);
      const message = err.response?.data?.error || err.message || 'Erreur lors de la validation';
      setError(message);
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
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-h3 font-semibold text-[var(--text-1)]">Validation du certificat</h1>
            <p className="mt-1 text-sm text-[var(--text-3)]">Validation du token et recuperation du certificat.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {loading && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-300">
            Validation en cours...
          </div>
        )}

        {error && !loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle size={18} className="flex-shrink-0" />
              {error}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              Aller au tableau de bord
            </button>
          </div>
        )}

        {success && certificate && !loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle size={18} className="flex-shrink-0" />
              Certificat valide avec succes.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Detail label="ID certificat" value={certificate.certificateId} mono />
              <Detail label="Empreinte" value={certificate.fingerprint} mono />
              <Detail label="Delivre le" value={new Date(certificate.issuedAt).toLocaleDateString('fr-FR')} />
              <Detail label="Expire le" value={new Date(certificate.expiresAt).toLocaleDateString('fr-FR')} />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadCertificate}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <Download size={16} />
                Telecharger le certificat
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              >
                Aller au tableau de bord
              </button>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-300">
              <div className="mb-2 font-semibold">Apercu PEM</div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words">{certificate.certificate.substring(0, 200)}...</pre>
            </div>
          </div>
        )}
      </section>

      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        Utilisateur: <span className="font-semibold">{user?.email}</span>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className={`mt-1 font-semibold text-neutral-800 dark:text-neutral-200 ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</div>
    </div>
  );
}

