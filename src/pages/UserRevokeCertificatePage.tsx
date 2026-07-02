import { useEffect, useState } from 'react';
import { Certificate, userService } from '../services/api';
import { ShieldOff, CheckCircle, CalendarDays, Hash, KeyRound, AlertTriangle } from 'lucide-react';

export default function UserRevokeCertificatePage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    userService
      .getMyCertificates()
      .then(setCertificates)
      .catch(() => setError('Erreur lors du chargement des certificats.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleRevoke(id: string) {
    setError(null);
    setMessage(null);
    setRevoking(id);
    try {
      await userService.revokeCertificate(id, reasons[id]);
      setMessage('Votre certificat a été révoqué.');
      const refreshed = await userService.getMyCertificates();
      setCertificates(refreshed);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la révocation.');
    } finally {
      setRevoking(null);
    }
  }

  function statusBadgeClass(s: string) {
    switch (s) {
      case 'ACTIVE':  return 'status-badge status-active';
      case 'REVOKED': return 'status-badge status-revoked';
      case 'EXPIRED': return 'status-badge status-rejected';
      default:        return 'status-badge status-pending';
    }
  }

  function formatDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">PKI ANTIC</p>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <ShieldOff size={22} /> Révoquer un certificat
            </h1>
            <p className="mt-0.5 text-sm text-white/60">
              Si votre clé privée est compromise, révoquez votre certificat immédiatement.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <ShieldOff size={24} className="text-white" />
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/30">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Action irréversible</p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
            La révocation d'un certificat est définitive. Une nouvelle CRL sera publiée automatiquement.
          </p>
        </div>
      </div>

      {/* Feedback banners */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle size={16} /> {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      ) : certificates.length === 0 ? (
        <div className="pki-card p-10 text-center">
          <ShieldOff size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">Aucun certificat à révoquer.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {certificates.map((cert) => (
            <div key={cert.id} className="pki-card p-5 space-y-0">
              {/* Card header */}
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <KeyRound size={18} className={cert.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {cert.subjectDN?.split(',')[0]?.replace('CN=', '') || cert.id.slice(0, 16)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {cert.subjectDN?.split(',')[1]?.replace('O=', '') || ''}
                    </div>
                  </div>
                </div>
                <span className={statusBadgeClass(cert.status)}>{cert.status}</span>
              </div>

              {/* Info rows */}
              <div className="info-row">
                <span className="info-row-label"><Hash size={12} /> Numéro de série</span>
                <span className="info-row-value font-mono text-xs">{cert.serialNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label"><CalendarDays size={12} /> Date d'émission</span>
                <span className="info-row-value">{formatDate(cert.notBefore)}</span>
              </div>
              <div className="info-row" style={{ borderBottom: 'none' }}>
                <span className="info-row-label"><CalendarDays size={12} /> Date d'expiration</span>
                <span className="info-row-value">{formatDate(cert.notAfter)}</span>
              </div>

              {/* Revoke form or status */}
              {cert.status === 'ACTIVE' ? (
                <div className="mt-4 space-y-2">
                  <input
                    type="text"
                    className="pki-input text-xs"
                    placeholder="Raison de révocation (optionnel)"
                    value={reasons[cert.id] || ''}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                  />
                  <button
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={revoking === cert.id}
                    onClick={() => handleRevoke(cert.id)}
                  >
                    <ShieldOff size={14} />
                    {revoking === cert.id ? 'Révocation...' : 'Révoquer ce certificat'}
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                  Ce certificat n'est plus actif et ne peut pas être révoqué.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
