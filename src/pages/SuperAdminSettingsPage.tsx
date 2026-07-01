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
    label: "Délai d'expiration des récépissés (jours)",
    hint: "Nombre de jours de validité d'un récépissé après génération (1–365).",
    type: 'number',
  },
  entite_code: {
    label: 'Code entité (utilisé dans la numérotation)',
    hint: "Sigle de l'entité inclus dans le numéro : REC-YYYYMMDD-{CODE}-000001.",
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
    return <div className="py-16 text-center text-slate-500 dark:text-slate-400">Chargement...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div className="page-header-bar">
        <div className="flex items-center gap-3">
          <Settings2 size={28} className="text-white/80 flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-white">Configuration globale</h1>
            <p className="mt-0.5 text-sm text-white/70">
              Paramètres appliqués à l'ensemble de la plateforme ANTIC.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {parametres.map((p) => {
          const meta = LABELS[p.cle];
          const fb = feedback[p.cle];
          return (
            <div key={p.cle} className="pki-card p-6">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                {meta?.label ?? p.cle}
              </label>
              {(meta?.hint || p.description) && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {meta?.hint ?? p.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <input
                  type={meta?.type ?? 'text'}
                  min={meta?.type === 'number' ? 1 : undefined}
                  max={meta?.type === 'number' ? 365 : undefined}
                  value={values[p.cle] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [p.cle]: e.target.value }))}
                  className="pki-input"
                  style={{ maxWidth: '200px' }}
                />
                <button
                  onClick={() => save(p.cle)}
                  disabled={saving === p.cle}
                  className="btn btn-primary"
                  style={{ padding: '9px 16px', fontSize: '13px' }}
                >
                  {saving === p.cle
                    ? <RefreshCw size={14} className="animate-spin" />
                    : <Save size={14} />}
                  Enregistrer
                </button>
              </div>
              {fb && (
                <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${fb.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
