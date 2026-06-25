import { useEffect, useState } from 'react';
import { Settings2, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

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

const LABELS: Record<string, { label: string; hint: string; type: 'number' | 'text' }> = {
  delai_expiration_defaut: {
    label: 'Délai d\'expiration des récépissés (jours)',
    hint: 'Nombre de jours de validité d\'un récépissé après génération (1–365).',
    type: 'number',
  },
  entite_code: {
    label: 'Code entité (utilisé dans la numérotation)',
    hint: 'Sigle de l\'entité inclus dans le numéro : REC-YYYYMMDD-{CODE}-000001.',
    type: 'text',
  },
};

export default function SuperAdminSettingsPage() {
  const [parametres, setParametres] = useState<Parametre[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});

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
        setFeedback((f) => ({ ...f, [cle]: { ok: true, msg: 'Sauvegardé.' } }));
        setTimeout(() => setFeedback((f) => ({ ...f, [cle]: undefined as any })), 2500);
      }
    } catch {
      setFeedback((f) => ({ ...f, [cle]: { ok: false, msg: 'Erreur réseau.' } }));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-neutral-500">Chargement...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-200 bg-white p-6 shadow-sm dark:border-purple-900/40 dark:bg-neutral-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(147,51,234,0.12),_transparent_60%)]" />
        <div className="relative z-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300">
            <Settings2 size={12} /> Paramètres système
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Configuration globale</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Paramètres appliqués à l'ensemble de la plateforme ANTIC.
          </p>
        </div>
      </div>

      {/* Paramètres */}
      <div className="space-y-4">
        {parametres.map((p) => {
          const meta = LABELS[p.cle];
          const fb = feedback[p.cle];
          return (
            <div
              key={p.cle}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {meta?.label ?? p.cle}
              </label>
              {meta?.hint && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{meta.hint}</p>
              )}
              {p.description && !meta?.hint && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{p.description}</p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <input
                  type={meta?.type ?? 'text'}
                  min={meta?.type === 'number' ? 1 : undefined}
                  max={meta?.type === 'number' ? 365 : undefined}
                  value={values[p.cle] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [p.cle]: e.target.value }))}
                  className="w-40 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
                <button
                  onClick={() => save(p.cle)}
                  disabled={saving === p.cle}
                  className="flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-60 dark:border-purple-700"
                >
                  {saving === p.cle
                    ? <RefreshCw size={14} className="animate-spin" />
                    : <Save size={14} />}
                  Enregistrer
                </button>
              </div>
              {fb && (
                <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${fb.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {fb.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {fb.msg}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
