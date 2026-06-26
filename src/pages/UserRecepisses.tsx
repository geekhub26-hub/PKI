import { useEffect, useState } from 'react';
import { Download, FileText, RefreshCw, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';

interface Recepisse {
  id: string;
  numero: string;
  nomComplet: string;
  typeCertificat: string;
  dateGeneration: string;
  dateExpiration: string;
  statut: 'VALIDE' | 'EXPIRE' | 'ANNULE' | 'REMPLACE';
  hashSha256: string;
  motifAnnulation: string;
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function StatutBadge({ statut }: { statut: string }) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    VALIDE:   { label: 'Valide',    cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: <CheckCircle size={12} /> },
    EXPIRE:   { label: 'Expiré',    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',        icon: <Clock size={12} /> },
    ANNULE:   { label: 'Annulé',    cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',            icon: <XCircle size={12} /> },
    REMPLACE: { label: 'Remplacé',  cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',   icon: <AlertCircle size={12} /> },
  };
  const s = cfg[statut] ?? cfg['EXPIRE'];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function UserRecepisses() {
  const [recepisses, setRecepisses] = useState<Recepisse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [signedDl, setSignedDl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/user/recepisses`, { headers: authHeader() })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setRecepisses(data);
        else throw new Error('Format de réponse inattendu');
      })
      .catch((e) => setError(`Impossible de charger vos récépissés. (${e.message})`))
      .finally(() => setLoading(false));
  }, []);

  const download = async (rec: Recepisse) => {
    setDownloading(rec.id);
    try {
      const res = await fetch(`${API_BASE}/user/recepisses/${rec.id}/download`, { headers: authHeader() });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${rec.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Téléchargement impossible.');
    } finally {
      setDownloading(null);
    }
  };

  const downloadSigned = async (rec: Recepisse) => {
    setSignedDl(rec.id);
    try {
      const res = await fetch(`${API_BASE}/user/recepisses/${rec.id}/download/signed`, { headers: authHeader() });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${rec.numero}-signe.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Téléchargement du PDF signé impossible. Une AC active est requise.');
    } finally {
      setSignedDl(null);
    }
  };

  const valides = recepisses.filter((r) => r.statut === 'VALIDE');
  const expires = recepisses.filter((r) => r.statut === 'EXPIRE');

  if (loading) {
    return <div className="py-10 text-center text-neutral-500 dark:text-neutral-400">Chargement...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.15),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_55%)]" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <FileText size={12} />
              Récépissés
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Mes récépissés</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Consultez et téléchargez vos récépissés de demande de certificat électronique.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{valides.length}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Valide{valides.length > 1 ? 's' : ''}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-xl font-bold text-amber-500 dark:text-amber-400">{expires.length}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Expiré{expires.length > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {recepisses.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <FileText size={36} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Aucun récépissé disponible.</p>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            Un récépissé sera généré après validation de votre demande par un administrateur.
          </p>
        </div>
      )}

      {/* Liste */}
      {recepisses.length > 0 && (
        <div className="space-y-3">
          {recepisses.map((rec) => {
            const isExpiring = rec.statut === 'VALIDE' &&
              new Date(rec.dateExpiration) < new Date(Date.now() + 7 * 86400000);

            return (
              <div
                key={rec.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {rec.numero}
                      </span>
                      <StatutBadge statut={rec.statut} />
                      {isExpiring && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                          <AlertCircle size={10} /> Expire bientôt
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>Type : {rec.typeCertificat || '—'}</span>
                      <span>Généré le {fmt(rec.dateGeneration)}</span>
                      <span>Expire le {fmt(rec.dateExpiration)}</span>
                    </div>
                    {rec.motifAnnulation && (
                      <div className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                        Motif : {rec.motifAnnulation}
                      </div>
                    )}
                    {rec.hashSha256 && (
                      <p className="mt-2 break-all font-mono text-[10px] text-neutral-400 dark:text-neutral-600">
                        SHA-256 : {rec.hashSha256}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() => download(rec)}
                      disabled={downloading === rec.id}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      {downloading === rec.id ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                      Télécharger PDF
                    </button>
                    <button
                      onClick={() => downloadSigned(rec)}
                      disabled={signedDl === rec.id}
                      title="PDF avec signature numérique X.509 de l'AC"
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                    >
                      {signedDl === rec.id ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                      PDF signé X.509
                    </button>
                    <a
                      href={`/#/verify?numero=${rec.numero}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400 dark:hover:bg-sky-900/40"
                    >
                      Vérifier
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
