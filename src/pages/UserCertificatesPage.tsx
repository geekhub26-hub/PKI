import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck, Download, RefreshCw, CalendarDays,
  KeyRound, Award, Lock, CheckCircle, ChevronRight,
} from 'lucide-react';
import { Certificate, userService } from '../services/api';

export default function UserCertificatesPage() {
  const [certificates, setCertificates]         = useState<Certificate[]>([]);
  const [selectedCertId, setSelectedCertId]     = useState<string | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);
  const [downloading, setDownloading]           = useState<'pem' | 'crt' | 'p12' | null>(null);
  const [p12GeneratedPassword, setP12GeneratedPassword] = useState<string | null>(null);
  const [p12EmailSent, setP12EmailSent]         = useState(false);
  const [p12PendingData, setP12PendingData]     = useState<{ p12Base64: string; filename: string } | null>(null);
  const [renewMessage, setRenewMessage]         = useState<string | null>(null);

  useEffect(() => {
    userService
      .getMyCertificates()
      .then((certs) => {
        setCertificates(certs);
        setSelectedCertId(certs[0]?.id || null);
      })
      .catch(() => setError('Erreur lors du chargement du certificat.'))
      .finally(() => setLoading(false));
  }, []);

  const cert = useMemo(
    () => certificates.find((c) => c.id === selectedCertId) || certificates[0] || null,
    [certificates, selectedCertId],
  );

  function formatDate(dateStr?: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async function downloadCertificate(format: 'pem' | 'crt') {
    if (!cert?.id) return;
    try {
      setDownloading(format);
      const blob = await userService.downloadCertificate(cert.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${cert.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Erreur lors du téléchargement du certificat.');
    } finally {
      setDownloading(null);
    }
  }

  async function downloadP12() {
    if (!cert?.id) return;
    try {
      setDownloading('p12');
      setP12GeneratedPassword(null);
      setP12PendingData(null);
      const { p12Base64, password, emailSent, filename } = await userService.downloadCertificateP12(cert.id);
      // Show password first — user must click "Télécharger" to actually get the file
      setP12GeneratedPassword(password);
      setP12EmailSent(emailSent);
      setP12PendingData({ p12Base64, filename });
    } catch {
      setError('Erreur lors du téléchargement du fichier .p12.');
    } finally {
      setDownloading(null);
    }
  }

  function triggerP12Download() {
    if (!p12PendingData) return;
    const { p12Base64, filename } = p12PendingData;
    const bytes = Uint8Array.from(atob(p12Base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/x-pkcs12' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setP12PendingData(null);
  }

  async function renewCertificate() {
    if (!cert?.id) return;
    try {
      setError(null);
      setRenewMessage(null);
      const resp = await userService.renewCertificate(cert.id);
      setRenewMessage(resp?.message || 'Demande de renouvellement créée.');
    } catch {
      setError('Erreur lors de la création du renouvellement.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">PKI ANTIC</p>
            <h1 className="text-2xl font-bold text-white">Mes certificats</h1>
            <p className="mt-0.5 text-sm text-white/60">Certificats numériques X.509</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck size={24} className="text-white" />
          </div>
        </div>
      </div>

      {renewMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle size={16} /> {renewMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left — cert details */}
        <div className="pki-card p-6 md:col-span-2">
          <div className="section-title">
            <div className="flex items-center gap-2">
              <Award size={15} className="text-blue-500" />
              <span>Informations du certificat</span>
            </div>
            {cert && <span className="status-badge status-active">Actif</span>}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
            </div>
          ) : !cert ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
              <ShieldCheck size={30} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500">Aucun certificat trouvé.</p>
            </div>
          ) : (
            <>
              <div>
                <div className="info-row">
                  <span className="info-row-label"><Award size={12} /> Titulaire (CN)</span>
                  <span className="info-row-value">
                    {cert.subjectDN.split(',')[0]?.replace('CN=', '') || '—'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-row-label"><ShieldCheck size={12} /> Organisation</span>
                  <span className="info-row-value">
                    {cert.subjectDN.split(',')[1]?.replace('O=', '') || '—'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-row-label"><Lock size={12} /> Algorithme</span>
                  <span className="info-row-value">RSA 4096 bits</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label"><CalendarDays size={12} /> Date d'émission</span>
                  <span className="info-row-value">{formatDate(cert.notBefore)}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label"><CalendarDays size={12} /> Date d'expiration</span>
                  <span className="info-row-value">{formatDate(cert.notAfter)}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label"><KeyRound size={12} /> Numéro de série</span>
                  <span className="info-row-value font-mono text-xs">
                    {cert.serialNumber.match(/.{1,2}/g)?.join(':') || cert.serialNumber}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Empreinte SHA-256
                </p>
                <p className="break-all font-mono text-xs text-slate-600 dark:text-slate-300">
                  {cert.serialNumber ? cert.serialNumber.replace(/(.{2})/g, '$1:').slice(0, -1) : ''} …
                </p>
              </div>

              {cert.status === 'ACTIVE' && (
                <div className="mt-5">
                  <button onClick={renewCertificate} className="btn btn-primary">
                    <RefreshCw size={14} /> Demander un renouvellement
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Cert selector */}
          <div className="pki-card p-5">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Certificats ({certificates.length})</span>
              </div>
            </div>
            {certificates.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun certificat.</p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-auto pr-1">
                {certificates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCertId(c.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                      c.id === cert?.id
                        ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {c.subjectDN.split(',')[0]?.replace('CN=', '') || c.id.slice(0, 8)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {formatDate(c.notBefore)} – {formatDate(c.notAfter)}
                      </div>
                    </div>
                    <ChevronRight size={12} className="shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Downloads */}
          <div className="pki-card p-5">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <Download size={14} className="text-blue-500" />
                <span>Télécharger</span>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => downloadCertificate('crt')}
                disabled={downloading !== null || !cert}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} />
                {downloading === 'crt' ? 'Téléchargement...' : 'Certificat (.crt)'}
              </button>
              <button
                onClick={() => downloadCertificate('pem')}
                disabled={downloading !== null || !cert}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} />
                {downloading === 'pem' ? 'Téléchargement...' : 'Certificat (.pem)'}
              </button>
              <p className="text-xs text-slate-400">.crt est compatible avec la plupart des navigateurs.</p>
            </div>

            <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Export PKCS#12 (.p12)</p>

              {cert && !cert.hasPrivateKey ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                  Export .p12 indisponible — clé privée non stockée sur le serveur.
                </div>
              ) : (
                <>
                  {!p12GeneratedPassword && (
                    <button
                      onClick={downloadP12}
                      disabled={downloading !== null || !cert}
                      className="btn btn-green w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <KeyRound size={14} />
                      {downloading === 'p12' ? 'Génération en cours...' : 'Générer le fichier .p12'}
                    </button>
                  )}

                  {p12GeneratedPassword && (
                    <div className="mt-2 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-3 dark:border-emerald-600 dark:bg-emerald-950/40">
                      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                        Mot de passe du fichier .p12
                      </p>
                      <div className="mb-2 break-all rounded-lg bg-white px-2 py-2 font-mono text-sm font-bold tracking-wider text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100 select-all">
                        {p12GeneratedPassword}
                      </div>
                      <p className="mb-3 text-xs text-emerald-700 dark:text-emerald-400">
                        {p12EmailSent
                          ? 'Également envoyé par email. '
                          : 'Notez ce mot de passe — il ne sera plus affiché. '}
                        Il vous sera demandé à l'ouverture du fichier.
                      </p>
                      {p12PendingData && (
                        <button
                          onClick={triggerP12Download}
                          className="btn btn-green w-full"
                        >
                          <Download size={14} />
                          Télécharger le fichier .p12
                        </button>
                      )}
                      <button
                        onClick={() => { setP12GeneratedPassword(null); setP12PendingData(null); }}
                        className="mt-2 w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Générer un nouveau .p12
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Conformity */}
          <div className="pki-card p-5">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>Conformité</span>
              </div>
            </div>
            <div className="space-y-2">
              {['Certificat X.509 v3', 'Chiffrement RSA 4096 bits', 'Conforme PKCS#12', 'Horodatage certifié'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
