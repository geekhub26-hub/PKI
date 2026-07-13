import { useEffect, useState } from 'react';
import {
  Settings2, Save, RefreshCw, CheckCircle, AlertCircle,
  Hash, Clock, UserPlus, Building2, Mail, KeyRound, ShieldCheck,
} from 'lucide-react';
import { adminService } from '../services/api';
import { useToast } from '../components/Toast';

interface Parametre {
  cle: string;
  valeur: string;
  description: string;
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

const ROLE_LABELS: Record<string, { label: string; desc: string }> = {
  ADMIN:      { label: 'Admin global',     desc: 'Accès complet à toutes les entités' },
  AE_CENTRALE:{ label: 'AE Centrale',      desc: 'Gestion de son entité centrale' },
  ADMIN_AEL:  { label: 'Admin AEL',        desc: 'Administration d\'une AEL' },
  AEL:        { label: 'Opérateur AEL',    desc: 'Traitement des demandes d\'une AEL' },
};

const ADMIN_ROLES = Object.keys(ROLE_LABELS);

const inputCls = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500';

export default function SuperAdminSettingsPage() {
  const { addToast } = useToast();

  // Paramètres
  const [parametres, setParametres] = useState<Parametre[]>([]);
  const [loadingParams, setLoadingParams] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});

  // Entités & formulaire admin
  const [entites, setEntites] = useState<any[]>([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', telephone: '',
    role: 'ADMIN', entiteId: '',
  });
  const [busyAdmin, setBusyAdmin] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoadingParams(true);
    try {
      const [params, ents] = await Promise.all([
        adminService.getParametres(),
        adminService.listEntites().catch(() => [] as any[]),
      ]);
      const safeParams = Array.isArray(params) ? params : [];
      setParametres(safeParams);
      const init: Record<string, string> = {};
      safeParams.forEach((p: Parametre) => { init[p.cle] = p.valeur; });
      setValues(init);
      setEntites(Array.isArray(ents) ? ents : []);
    } catch (e: any) {
      addToast({ type: 'error', message: e?.message || 'Erreur de chargement' });
      setParametres([]);
    } finally {
      setLoadingParams(false);
    }
  };

  const save = async (cle: string) => {
    setSaving(cle);
    setFeedback((f) => ({ ...f, [cle]: undefined as any }));
    try {
      await adminService.updateParametre(cle, values[cle]);
      setFeedback((f) => ({ ...f, [cle]: { ok: true, msg: 'Sauvegardé.' } }));
      setTimeout(() => setFeedback((f) => ({ ...f, [cle]: undefined as any })), 3000);
    } catch (e: any) {
      setFeedback((f) => ({ ...f, [cle]: { ok: false, msg: e?.message || 'Erreur.' } }));
    } finally {
      setSaving(null);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setAdminSuccess('');
    setAdminError('');
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');
    if (!form.firstName.trim()) { setAdminError('Le prénom est requis.'); return; }
    if (!form.lastName.trim())  { setAdminError('Le nom est requis.'); return; }
    if (!form.email.trim())     { setAdminError('L\'email est requis.'); return; }
    if (form.role !== 'ADMIN' && !form.entiteId) {
      setAdminError('Une entité est requise pour ce rôle.'); return;
    }
    setBusyAdmin(true);
    try {
      const result = await adminService.createAdminUser({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        entiteId: form.entiteId || undefined,
        telephone: form.telephone.trim() || undefined,
      });
      setAdminSuccess(result?.message || `Compte créé — mot de passe temporaire envoyé à ${form.email}`);
      setForm({ firstName: '', lastName: '', email: '', telephone: '', role: 'ADMIN', entiteId: '' });
    } catch (err: any) {
      setAdminError(err?.message || 'Erreur lors de la création.');
    } finally {
      setBusyAdmin(false);
    }
  };

  if (loadingParams) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">

      {/* ── Header ── */}
      <div className="page-header-bar">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Settings2 size={24} className="text-white" />
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Super Administration</p>
            <h1 className="text-2xl font-bold text-white">Configuration globale</h1>
            <p className="mt-0.5 text-sm text-white/60">Paramètres de la plateforme ANTIC PKI.</p>
          </div>
        </div>
      </div>

      {/* ── Paramètres système ── */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Settings2 size={14} /> Paramètres système
        </h2>

        {parametres.length === 0 ? (
          <div className="pki-card p-8 text-center text-sm text-slate-400">Aucun paramètre disponible.</div>
        ) : parametres.map((p) => {
          const meta = LABELS[p.cle];
          const fb   = feedback[p.cle];
          return (
            <div key={p.cle} className="pki-card p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {meta?.icon ?? <Settings2 size={14} />}
                {meta?.label ?? p.cle}
              </div>
              {(meta?.hint || p.description) && (
                <p className="mb-3 text-xs text-slate-400">{meta?.hint ?? p.description}</p>
              )}
              <div className="flex items-center gap-3">
                <input
                  type={meta?.type ?? 'text'}
                  min={meta?.type === 'number' ? 1 : undefined}
                  max={meta?.type === 'number' ? 365 : undefined}
                  value={values[p.cle] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [p.cle]: e.target.value }))}
                  className={inputCls}
                  style={{ maxWidth: '200px' }}
                />
                <button
                  onClick={() => save(p.cle)}
                  disabled={saving === p.cle}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving === p.cle ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  Enregistrer
                </button>
              </div>
              {fb && (
                <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${fb.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fb.ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />} {fb.msg}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ── Créer un administrateur ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <UserPlus size={14} /> Créer un administrateur
        </h2>

        <div className="pki-card overflow-hidden">
          {/* Notice mot de passe auto */}
          <div className="flex items-start gap-3 border-b border-slate-100 bg-violet-50 px-5 py-4 dark:border-slate-700 dark:bg-violet-950/20">
            <KeyRound size={16} className="mt-0.5 shrink-0 text-violet-500" />
            <div>
              <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">Mot de passe automatique</p>
              <p className="text-xs text-violet-600 dark:text-violet-400">
                Aucun mot de passe à saisir. Un mot de passe temporaire sécurisé sera généré
                et envoyé directement par email à l'administrateur dès la création du compte.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-5 p-5">
            {/* Nom & Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Jean"
                  value={form.firstName}
                  onChange={set('firstName')}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Dupont"
                  value={form.lastName}
                  onChange={set('lastName')}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><Mail size={13} /> Adresse email <span className="text-red-500">*</span></span>
              </label>
              <input
                type="email"
                placeholder="admin@exemple.cm"
                value={form.email}
                onChange={set('email')}
                className={inputCls}
                required
              />
              <p className="mt-1 text-xs text-slate-400">Le mot de passe temporaire sera envoyé à cette adresse.</p>
            </div>

            {/* Téléphone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Téléphone <span className="text-xs font-normal text-slate-400">(optionnel)</span>
              </label>
              <input
                type="tel"
                placeholder="+237 6XX XXX XXX"
                value={form.telephone}
                onChange={set('telephone')}
                className={inputCls}
              />
            </div>

            {/* Rôle */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Rôle <span className="text-red-500">*</span></span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ADMIN_ROLES.map((r) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      form.role === r
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={form.role === r}
                      onChange={set('role')}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div>
                      <p className={`text-sm font-semibold ${form.role === r ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                        {ROLE_LABELS[r].label}
                      </p>
                      <p className="text-xs text-slate-400">{ROLE_LABELS[r].desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Entité (conditionnelle) */}
            {form.role !== 'ADMIN' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5"><Building2 size={13} /> Entité <span className="text-red-500">*</span></span>
                </label>
                <select value={form.entiteId} onChange={set('entiteId')} className={inputCls}>
                  <option value="">— Sélectionner une entité —</option>
                  {entites.filter((e) => e.isActive).map((e: any) => (
                    <option key={e.id} value={e.id}>{e.nom} ({e.code})</option>
                  ))}
                </select>
                {entites.filter((e) => e.isActive).length === 0 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Aucune entité active. Créez d'abord une entité dans la page "Gérer les entités".
                  </p>
                )}
              </div>
            )}

            {/* Feedback */}
            {adminError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle size={14} className="shrink-0" /> {adminError}
              </div>
            )}
            {adminSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle size={14} className="shrink-0" /> {adminSuccess}
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={busyAdmin}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAdmin
                ? <><RefreshCw size={14} className="animate-spin" /> Création en cours...</>
                : <><UserPlus size={14} /> Créer le compte administrateur</>
              }
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
