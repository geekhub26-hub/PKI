import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Search, Shield } from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';

interface VerifyResult {
  found: boolean;
  numero?: string;
  statut?: string;
  nomComplet?: string;
  typeCertificat?: string;
  dateGeneration?: string;
  dateExpiration?: string;
  hashSha256?: string;
  motifAnnulation?: string;
  message?: string;
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    VALIDE:   { label: 'VALIDE',   className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: <CheckCircle size={14} /> },
    EXPIRE:   { label: 'EXPIRÉ',   className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',       icon: <AlertCircle size={14} /> },
    ANNULE:   { label: 'ANNULÉ',   className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',           icon: <XCircle size={14} /> },
    REMPLACE: { label: 'REMPLACÉ', className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',  icon: <AlertCircle size={14} /> },
  };
  const s = map[statut] ?? map['EXPIRE'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${s.className}`}>
      {s.icon} {s.label}
    </span>
  );
}

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const [numero, setNumero] = useState(searchParams.get('numero') ?? '');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const n = searchParams.get('numero');
    if (n) { setNumero(n); verify(n); }
  }, []);

  const verify = async (n?: string) => {
    const target = (n ?? numero).trim();
    if (!target) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/public/verify/${encodeURIComponent(target)}`);
      const data: VerifyResult = await res.json();
      setResult(data);
    } catch {
      setResult({ found: false, message: 'Impossible de joindre le serveur. Vérifiez votre connexion.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verify();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <img src="/logo.jpeg" alt="ANTIC" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">ANTIC Cameroun</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Vérification de récépissé électronique</p>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Shield size={12} />
            Portail officiel
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-900 shadow-lg">
            <Shield className="text-white" size={28} />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Vérification de récépissé
          </h2>
          <p className="mx-auto max-w-xl text-gray-500 dark:text-gray-400">
            Saisissez le numéro du récépissé ou scannez le QR code pour vérifier son authenticité et sa validité.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex: REC-20260625-ANTIC-000001"
                className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-800 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !numero.trim()}
              className="flex h-12 items-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
          </div>
        </form>

        {/* Result */}
        {result && (
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            {!result.found ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <XCircle size={48} className="text-rose-400" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Récépissé introuvable</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{result.message}</p>
              </div>
            ) : (
              <>
                {/* Status banner */}
                <div className={`flex items-center justify-between rounded-t-2xl px-6 py-4 ${
                  result.statut === 'VALIDE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : result.statut === 'ANNULE'
                    ? 'bg-rose-50 dark:bg-rose-950/30'
                    : 'bg-amber-50 dark:bg-amber-950/30'
                }`}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Récépissé</p>
                    <p className="mt-0.5 font-mono text-base font-bold text-gray-900 dark:text-white">{result.numero}</p>
                  </div>
                  <StatutBadge statut={result.statut!} />
                </div>

                {/* Details */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    { label: 'Titulaire',          value: result.nomComplet },
                    { label: 'Type de certificat', value: result.typeCertificat },
                    { label: 'Généré le',           value: result.dateGeneration },
                    { label: 'Expire le',           value: result.dateExpiration },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-6 py-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Hash */}
                {result.hashSha256 && (
                  <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Empreinte SHA-256</p>
                    <p className="break-all font-mono text-xs text-gray-600 dark:text-gray-400">{result.hashSha256}</p>
                  </div>
                )}

                {/* Motif annulation */}
                {result.motifAnnulation && (
                  <div className="border-t border-rose-100 bg-rose-50 px-6 py-4 dark:border-rose-900/30 dark:bg-rose-950/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Motif d'annulation</p>
                    <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{result.motifAnnulation}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Info boxes */}
        {!result && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: '🔍', title: 'Saisie manuelle', text: 'Entrez le numéro de récépissé au format REC-AAAAMMJJ-ANTIC-000001' },
              { icon: '📱', title: 'QR Code', text: 'Scannez le QR code présent sur le PDF du récépissé avec votre smartphone' },
              { icon: '✅', title: 'Résultat instantané', text: 'Obtenez immédiatement le statut : Valide, Expiré ou Annulé' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-2 text-2xl">{item.icon}</div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.text}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 dark:border-gray-800">
        © {new Date().getFullYear()} ANTIC Cameroun — Plateforme PKI Souveraine
      </footer>
    </div>
  );
}
