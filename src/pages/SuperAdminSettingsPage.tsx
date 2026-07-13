import { useEffect, useState } from 'react';
import {
  Settings2, Save, RefreshCw, CheckCircle, AlertCircle,
  Hash, Clock, UserPlus, Building2, ShieldCheck, Copy, Eye, EyeOff,
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

const ROLE_OPTIONS = [
  { value: 'ADMIN',       label: 'Admin global',    desc: 'Accès complet, toutes entités' },
  { value: 'AE_CENTRALE', label: 'AE Centrale',     desc: 'Gestion d\'une AE Centrale' },
  { value: 'ADMIN_AEL',   label: 'Admin AEL',       desc: 'Administration d\'une AEL' },
  { value: 'AEL',         label: 'Opérateur AEL',   desc: 'Traitement des demandes AEL' },
];

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
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', telephone: '', role: 'ADMIN', entiteId: '' });
  const [busyAdmin, setBusyAdmin] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<{ email: string; role: string; tempPassword: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoadingParams(true);
    try {
      const [params, ents] = await Promise.all([
        adminService.getParametres(),
        adminService.listEntites().catch(() => [] as any[]),
      ]);
      const safe = Array.isArray(params) ? params : [];
      setParametres(safe);
      const init: Record<string, string> = {};
      safe.forEach((p: Parametre) => { init[p.cle] = p.valeur; });
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

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setAdminError('');
    setCreatedAdmin(null);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setCreatedAdmin(null);
    if (!form.firstName.trim()) { setAdminError('Le prénom est requis.'); return; }
    if (!form.lastName.trim())  { setAdminError('Le nom est requis.'); return; }
    if (!form.email.trim())     { setAdminError('L\'email est requis.'); return; }
    if (form.role !== 'ADMIN' && !form.entiteId) { setAdminError('Sélectionnez une entité pour ce rôle.'); return; }
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
      setCreatedAdmin({ email: form.email.trim(), role: form.role, tempPassword: result.tempPassword });
      setShowPassword(false);
      setForm({ firstName: '', lastName: '', email: '', telephone: '', role: 'ADMIN', entiteId: '' });
    } catch (err: any) {
      setAdminError(err?.message || 'Erreur lors de la création.');
    } finally {
      setBusyAdmin(false);
    }
  };

  const copyPassword = () => {
    if (createdAdmin) {
      navigator.clipboard.writeText(createdAdmin.tempPassword);
      addToast({ type: 'success', message: 'Mot de passe copié !' });
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
        <div className="section-title">
          <div className="flex items-center gap-2">
            <Settings2 size={15} className="text-slate-500" />
            <span>Paramètres système</span>
          </div>
        </div>

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
                  className="pki-input"
                  style={{ maxWidth: '200px' }}
                />
                <button
                  onClick={() => save(p.cle)}
                  disabled={saving === p.cle}
                  className="btn btn-green"
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
        <div className="section-title mb-4">
          <div className="flex items-center gap-2">
            <UserPlus size={15} className="text-violet-500" />
            <span>Créer un administrateur</span>
          </div>
        </div>

        {/* Résultat de création — mot de passe en clair affiché une seule fois */}
        {createdAdmin && (
          <div className="pki-card mb-4 overflow-hidden border-emerald-200 dark:border-emerald-700/50">
            <div className="flex items-center gap-3 bg-emerald-50 px-5 py-3 dark:bg-emerald-950/30">
              <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Compte créé avec succès</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{createdAdmin.email} — {createdAdmin.role}</p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mot de passe temporaire — à communiquer à l'administrateur
              </p>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800">
                  <span className="flex-1 font-mono text-sm tracking-wider text-slate-800 dark:text-slate-100">
                    {showPassword ? createdAdmin.tempPassword : '•'.repeat(createdAdmin.tempPassword.length)}
                  </span>
                  <button onClick={() => setShowPassword((v) => !v)} className="text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button onClick={copyPassword} className="btn btn-primary" title="Copier">
                  <Copy size={14} /> Copier
                </button>
              </div>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                ⚠ Ce mot de passe ne sera plus affiché. Copiez-le avant de quitter cette page.
              </p>
            </div>
          </div>
        )}

        <div className="pki-card overflow-hidden">
          {/* Notice */}
          <div className="flex items-start gap-3 border-b border-slate-100 bg-violet-50 px-5 py-4 dark:border-slate-700/60 dark:bg-violet-950/20">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-violet-500" />
            <p className="text-sm text-violet-700 dark:text-violet-300">
              <span className="font-semibold">Mot de passe auto-généré.</span>{' '}
              Aucune saisie requise — un mot de passe sécurisé est créé automatiquement et affiché ici après la création.
            </p>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-5 p-5">
            {/* Nom & Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="Jean" value={form.firstName} onChange={setField('firstName')} className="pki-input" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="Dupont" value={form.lastName} onChange={setField('lastName')} className="pki-input" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" placeholder="admin@exemple.cm" value={form.email} onChange={setField('email')} className="pki-input" required />
            </div>

            {/* Téléphone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Téléphone <span className="text-xs font-normal text-slate-400">(optionnel)</span>
              </label>
              <input type="tel" placeholder="+237 6XX XXX XXX" value={form.telephone} onChange={setField('telephone')} className="pki-input" />
            </div>

            {/* Rôle */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Rôle <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                      form.role === r.value
                        ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-950/30'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={setField('role')} className="mt-0.5 accent-emerald-600" />
                    <div>
                      <p className={`text-sm font-semibold ${form.role === r.value ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>
                        {r.label}
                      </p>
                      <p className="text-xs text-slate-400">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Entité */}
            {form.role !== 'ADMIN' && (
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Building2 size={13} /> Entité <span className="text-red-500">*</span>
                </label>
                <select value={form.entiteId} onChange={setField('entiteId')} className="pki-input">
                  <option value="">— Sélectionner une entité —</option>
                  {entites.filter((e) => e.isActive).map((e: any) => (
                    <option key={e.id} value={e.id}>{e.nom} ({e.code})</option>
                  ))}
                </select>
                {entites.filter((e) => e.isActive).length === 0 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Aucune entité active — créez-en une dans la page "Gérer les entités".
                  </p>
                )}
              </div>
            )}

            {/* Erreur */}
            {adminError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle size={14} className="shrink-0" /> {adminError}
              </div>
            )}

            <button type="submit" disabled={busyAdmin} className="btn btn-primary w-full justify-center">
              {busyAdmin
                ? <><RefreshCw size={14} className="animate-spin" /> Création en cours...</>
                : <><UserPlus size={14} /> Créer le compte administrateur</>}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
