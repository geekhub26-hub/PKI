import { useEffect, useState } from 'react';
import { Download, FileText, RefreshCw, AlertCircle } from 'lucide-react';

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
  const map: Record<string, { label: string; cls: string }> = {
    VALIDE:   { label: 'Valide',    cls: 'status-badge status-active' },
    EXPIRE:   { label: 'Expiré',    cls: 'status-badge status-pending' },
    ANNULE:   { label: 'Annulé',    cls: 'status-badge status-rejected' },
    REMPLACE: { label: 'Remplacé',  cls: 'status-badge status-revoked' },
  };
  const s = map[statut] ?? map['EXPIRE'];
  return <span className={s.cls}>{s.label}</span>;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function UserRecepisses() {
  const [recepisses, setRecepisses] = useState<Recepisse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [signedDl, setSignedDl]     = useState<string | null>(null);

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
    return <div className="py-10 text-center text-slate-500 dark:text-slate-400">Chargement...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <div className="page-header-bar">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mes récépissés</h1>
            <p className="mt-1 text-sm text-white/70">
              Consultez et téléchargez vos récépissés de demande de certificat.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center ring-1 ring-white/20">
              <div className="text-xl font-bold text-emerald-300">{valides.length}</div>
              <div className="text-[11px] text-white/60">Valide{valides.length > 1 ? 's' : ''}</div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center ring-1 ring-white/20">
              <div className="text-xl font-bold text-amber-300">{expires.length}</div>
              <div className="text-[11px] text-white/60">Expiré{expires.length > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {recepisses.length === 0 && !error && (
        <div className="pki-card p-12 text-center">
          <FileText size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucun récépissé disponible.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Un récépissé sera généré après validation de votre demande.
          </p>
        </div>
      )}

      {recepisses.length > 0 && (
        <div className="space-y-3">
          {recepisses.map((rec) => {
            const isExpiring = rec.statut === 'VALIDE' &&
              new Date(rec.dateExpiration) < new Date(Date.now() + 7 * 86400000);

            return (
              <div key={rec.id} className="pki-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                        {rec.numero}
                      </span>
                      <StatutBadge statut={rec.statut} />
                      {isExpiring && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                          <AlertCircle size={10} /> Expire bientôt
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
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
                      <p className="mt-2 break-all font-mono text-[10px] text-slate-400 dark:text-slate-600">
                        SHA-256 : {rec.hashSha256}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() => download(rec)}
                      disabled={downloading === rec.id}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      {downloading === rec.id ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                      PDF
                    </button>
                    <button
                      onClick={() => downloadSigned(rec)}
                      disabled={signedDl === rec.id}
                      title="PDF avec signature numérique X.509 de l'AC"
                      className="btn btn-green"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      {signedDl === rec.id ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                      PDF signé X.509
                    </button>
                    <a
                      href={`/#/verify?numero=${rec.numero}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400"
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
