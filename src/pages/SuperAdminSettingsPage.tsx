import { useEffect, useState } from 'react';
import { Settings2, Save, RefreshCw, CheckCircle, AlertCircle, Hash, Clock } from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';

interface Parametre {
  cle: string;
  valeur: string;
  description: string;
}

function authHeader() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const LABELS: Record<string, { label: string; hint: string; type: 'number' | 'text'; icon: React.ReactNode }> = {
  delai_expiration_defaut: {
    label: "Délai d'expiration des récépissés (jours)",
    hint: "Nombre de jours de validité d'un récépissé après génération (1–365).",
    type: 'number',
    icon: <Clock size={16} className="text-blue-500" />,
  },
  entite_code: {
    label: 'Code entité',
    hint: "Sigle de l'entité inclus dans le numéro : REC-YYYYMMDD-{CODE}-000001.",
    type: 'text',
    icon: <Hash size={16} className="text-emerald-500" />,
  },
};

export default function SuperAdminSettingsPage() {
  const [parametres, setParametres] = useState<Parametre[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<string | null>(null);
  const [values, setValues]         = useState<Record<string, string>>({});
  const [feedback, setFeedback]     = useState<Record<string, { ok: boolean; msg: string }>>({});

  useEffect(() => {
    fetch(`${API_BASE}/superadmin/parametres`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data: Parametre[]) => {
        setParametres(data);
        const init: Record<string, string> = {};
        data.forEach((p) => { init[p.cle] = p.valeur; });
        setValues(init);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (cle: string) => {
    setSaving(cle);
    setFeedback((f) => ({ ...f, [cle]: undefined as any }));
    try {
      const res = await fetch(`${API_BASE}/superadmin/parametres/${cle}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ valeur: values[cle] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback((f) => ({ ...f, [cle]: { ok: false, msg: data.error || 'Erreur.' } }));
      } else {
        setFeedback((f) => ({ ...f, [cle]: { ok: true, msg: 'Paramètre sauvegardé.' } }));
        setTimeout(() => setFeedback((f) => ({ ...f, [cle]: undefined as any })), 3000);
      }
    } catch {
      setFeedback((f) => ({ ...f, [cle]: { ok: false, msg: 'Erreur réseau.' } }));
    } finally { setSaving(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Settings2 size={24} className="text-white" />
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Super Administration</p>
            <h1 className="text-2xl font-bold text-white">Configuration globale</h1>
            <p className="mt-0.5 text-sm text-white/60">
              Paramètres appliqués à l'ensemble de la plateforme ANTIC PKI.
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/30">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Ces paramètres affectent l'ensemble des utilisateurs de la plateforme. Toute modification est immédiatement effective.
        </p>
      </div>

      {/* Param cards */}
      {parametres.length === 0 ? (
        <div className="pki-card p-10 text-center">
          <Settings2 size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">Aucun paramètre disponible.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {parametres.map((p) => {
            const meta = LABELS[p.cle];
            const fb   = feedback[p.cle];
            return (
              <div key={p.cle} className="pki-card p-6">
                <div className="section-title">
                  <div className="flex items-center gap-2">
                    {meta?.icon ?? <Settings2 size={15} className="text-slate-500" />}
                    <span>{meta?.label ?? p.cle}</span>
                  </div>
                </div>

                {(meta?.hint || p.description) && (
                  <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                    {meta?.hint ?? p.description}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type={meta?.type ?? 'text'}
                    min={meta?.type === 'number' ? 1 : undefined}
                    max={meta?.type === 'number' ? 365 : undefined}
                    value={values[p.cle] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [p.cle]: e.target.value }))}
                    className="pki-input"
                    style={{ maxWidth: '220px' }}
                  />
                  <button
                    onClick={() => save(p.cle)}
                    disabled={saving === p.cle}
                    className="btn btn-green disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving === p.cle
                      ? <RefreshCw size={14} className="animate-spin" />
                      : <Save size={14} />}
                    Enregistrer
                  </button>
                </div>

                {fb && (
                  <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${
                    fb.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {fb.ok
                      ? <CheckCircle size={13} />
                      : <AlertCircle size={13} />}
                    {fb.msg}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
