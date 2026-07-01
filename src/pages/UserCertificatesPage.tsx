import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Certificate, userService } from '../services/api';

export default function UserCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertId, setSelectedCertId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'pem' | 'crt' | 'p12' | null>(null);
  const [p12GeneratedPassword, setP12GeneratedPassword] = useState<string | null>(null);
  const [p12EmailSent, setP12EmailSent] = useState(false);
  const [renewMessage, setRenewMessage] = useState<string | null>(null);

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
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
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
      setError('Erreur lors du telechargement du certificat.');
    } finally {
      setDownloading(null);
    }
  }

  async function downloadP12() {
    if (!cert?.id) return;
    try {
      setDownloading('p12');
      setP12GeneratedPassword(null);
      const { p12Base64, password, emailSent, filename } = await userService.downloadCertificateP12(cert.id);
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
      setP12GeneratedPassword(password);
      setP12EmailSent(emailSent);
    } catch {
      setError('Erreur lors du téléchargement du fichier .p12.');
    } finally {
      setDownloading(null);
    }
  }

  async function renewCertificate() {
    if (!cert?.id) return;
    try {
      setError(null);
      setRenewMessage(null);
      const resp = await userService.renewCertificate(cert.id);
      setRenewMessage(resp?.message || 'Demande de renouvellement creee.');
    } catch {
      setError('Erreur lors de la creation du renouvellement.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes certificats</h1>
          <p className="mt-1 text-sm text-white/70">Certificats numériques X.509</p>
        </div>
        <ShieldCheck className="h-10 w-10 text-white/40" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left panel — cert details (2 cols) */}
        <div className="pki-card p-6 md:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Informations du certificat</h2>
            {cert && <span className="status-badge status-active">Actif</span>}
          </div>

          {renewMessage && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
              {renewMessage}
            </div>
          )}

          {loading ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 text-sm text-slate-500 dark:text-slate-400">
              Chargement...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          ) : !cert ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700/50 p-4 text-sm text-slate-500 dark:text-slate-400">
              Aucun certificat trouvé.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              <Info label="Titulaire (CN)" value={cert.subjectDN.split(',')[0]?.replace('CN=', '') || '-'} />
              <Info label="Date d'émission" value={formatDate(cert.notBefore)} />
              <Info label="Organisation" value={cert.subjectDN.split(',')[1]?.replace('O=', '') || '-'} />
              <Info label="Date d'expiration" value={formatDate(cert.notAfter)} />
              <Info label="Algorithme" value="RSA 4096 bits" />
              <Info label="Numéro de série" value={cert.serialNumber.match(/.{1,2}/g)?.join(':') || cert.serialNumber} mono />
            </div>
          )}

          {cert && (
            <div className="mt-6">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Empreinte SHA-256
              </div>
              <div className="break-all rounded-lg bg-slate-100 dark:bg-slate-800 p-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                SHA-256 : {cert.serialNumber ? cert.serialNumber.replace(/(.{2})/g, '$1:').slice(0, -1) : ''} ...
              </div>
              {cert.status === 'ACTIVE' && (
                <div className="mt-4">
                  <button onClick={renewCertificate} className="btn btn-primary">
                    Demander un renouvellement
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel — 3 stacked cards */}
        <div className="flex flex-col gap-4">
          {/* Card 1 — cert selector */}
          <div className="pki-card p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Sélectionner un certificat ({certificates.length})
            </div>
            {certificates.length === 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400">Aucun certificat.</div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-auto pr-1">
                {certificates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCertId(c.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                      c.id === cert?.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold">
                      {c.subjectDN.split(',')[0]?.replace('CN=', '') || c.id.slice(0, 8)}
                    </div>
                    <div className="mt-0.5 text-[11px] opacity-80">
                      {formatDate(c.notBefore)} – {formatDate(c.notAfter)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Card 2 — downloads */}
          <div className="pki-card p-5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Télécharger</div>

            <button
              onClick={() => downloadCertificate('crt')}
              disabled={downloading !== null || !cert}
              className="btn btn-primary w-full mb-2"
            >
              {downloading === 'crt' ? 'Téléchargement...' : 'Certificat (.crt)'}
            </button>

            <button
              onClick={() => downloadCertificate('pem')}
              disabled={downloading !== null || !cert}
              className="w-full mb-2 inline-flex items-center justify-center rounded-lg border-2 border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-400 dark:text-slate-300 dark:hover:bg-slate-800/30"
            >
              {downloading === 'pem' ? 'Téléchargement...' : 'Certificat (.pem)'}
            </button>

            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Le fichier .crt est compatible avec la plupart des navigateurs et applications.
            </p>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Export PKCS#12 (.p12)</div>

              {cert && !cert.hasPrivateKey ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                  Export .p12 indisponible — la clé privée n'est pas stockée sur le serveur (vous avez fourni votre
                  propre CSR).
                </div>
              ) : (
                <>
                  <button
                    onClick={downloadP12}
                    disabled={downloading !== null || !cert}
                    className="btn btn-green w-full"
                  >
                    {downloading === 'p12' ? 'Génération...' : 'Certificat + clé (.p12)'}
                  </button>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Le mot de passe est généré automatiquement et envoyé à votre adresse email.
                  </p>
                  {p12GeneratedPassword && (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-950/30">
                      <div className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Mot de passe de votre fichier .p12
                      </div>
                      <div className="break-all rounded bg-white px-2 py-1 font-mono text-sm font-bold tracking-widest text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100">
                        {p12GeneratedPassword}
                      </div>
                      <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                        {p12EmailSent
                          ? 'Également envoyé à votre adresse email.'
                          : 'Notez ce mot de passe — il ne sera plus affiché.'}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card 3 — conformity */}
          <div className="pki-card p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Conformité</div>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <li>Certificat X.509 v3</li>
              <li>Chiffrement RSA 4096 bits</li>
              <li>Conforme PKCS#12</li>
              <li>Horodatage certifié</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div
        className={`font-medium text-slate-800 dark:text-slate-100 ${mono ? 'font-mono tracking-wider text-xs' : 'text-sm'}`}
      >
        {value}
      </div>
    </div>
  );
}
