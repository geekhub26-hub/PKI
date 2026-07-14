import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { Download, ShieldOff, CheckCircle } from 'lucide-react';

export default function AdminDownloadCrlPage() {
  const [crlContent, setCrlContent] = useState<string>('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    adminService
      .getCrl()
      .then(setCrlContent)
      .catch((e: any) => setError(e?.message || 'Erreur lors du chargement de la CRL.'))
      .finally(() => setLoading(false));
  }, []);

  function downloadCrl() {
    const blob = new Blob([crlContent], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'crl.pem';
    document.body.appendChild(a); a.click();
    window.URL.revokeObjectURL(url); document.body.removeChild(a);
  }

  async function copyCrl() {
    await navigator.clipboard.writeText(crlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Download size={22} /> Télécharger la CRL
            </h1>
            <p className="mt-0.5 text-sm text-white/60">
              Consultez et diffusez la liste de révocation des certificats.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <ShieldOff size={24} className="text-white" />
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="pki-card p-6">
        <div className="section-title">
          <div className="flex items-center gap-2">
            <ShieldOff size={15} className="text-blue-500" />
            <span>À propos de la CRL</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { icon: ShieldOff, color: 'text-rose-500', title: 'Révocations', desc: 'Liste exhaustive des certificats révoqués par l\'AC.' },
            { icon: CheckCircle, color: 'text-emerald-500', title: 'Format standard', desc: 'Format X.509 CRL v2 conforme RFC 5280.' },
            { icon: Download, color: 'text-blue-500', title: 'Distribution', desc: 'Intégrez la CRL dans vos points de distribution LDAP ou HTTP.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <Icon size={18} className={`${color} mt-0.5 shrink-0`} />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CRL content */}
      <div className="pki-card p-5">
        <div className="section-title">
          <div className="flex items-center gap-2">
            <Download size={15} className="text-slate-500" />
            <span>Contenu CRL</span>
          </div>
          {crlContent && (
            <div className="flex gap-2">
              <button
                onClick={copyCrl}
                className="rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                {copied ? 'Copié !' : 'Copier'}
              </button>
              <button onClick={downloadCrl} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                <Download size={13} /> Télécharger
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : crlContent ? (
          <pre className="max-h-96 overflow-auto rounded-xl bg-slate-50 dark:bg-slate-800 p-4 font-mono text-xs text-slate-700 dark:text-slate-300">
            {crlContent}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <ShieldOff size={22} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">Aucune CRL disponible.</p>
            <p className="mt-1 text-xs text-slate-400">Générez d'abord une CRL depuis la page de gestion.</p>
          </div>
        )}
      </div>
    </div>
  );
}
