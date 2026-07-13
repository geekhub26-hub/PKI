import { useEffect, useState } from 'react';
import {
  Settings2, Save, RefreshCw, CheckCircle, AlertCircle,
  Hash, Clock, UserPlus, Building2, ShieldCheck, Copy, Eye, EyeOff,
  Timer, KeyRound, FileCheck2, Bell, Lock, BadgeCheck, RotateCcw,
} from 'lucide-react';
import { adminService } from '../services/api';
import { useToast } from '../components/Toast';

interface Parametre { cle: string; valeur: string; description: string; }

type ParamMeta = { label: string; hint: string; type: 'number' | 'text'; icon: JSX.Element; unit?: string };

const LABELS: Record<string, ParamMeta> = {
  delai_expiration_defaut:          { label: "Validité des récépissés",                  hint: "Nombre de jours de validité d'un récépissé après génération.",                         type: 'number', icon: <Clock      size={14} className="text-blue-500"    />, unit: 'jours'     },
  entite_code:                      { label: 'Code entité',                               hint: "Sigle inclus dans le numéro de récépissé : REC-YYYYMMDD-{CODE}-000001.",              type: 'text',   icon: <Hash       size={14} className="text-emerald-500" />                   },
  session_timeout_minutes:          { label: "Inactivité avant déconnexion auto",         hint: "L'utilisateur est déconnecté après cette durée d'inactivité.",                        type: 'number', icon: <Timer      size={14} className="text-amber-500"   />, unit: 'minutes'   },
  otp_expiry_minutes:               { label: "Validité du code OTP email",                hint: "Durée avant expiration du code OTP envoyé par email lors de l'inscription.",          type: 'number', icon: <KeyRound   size={14} className="text-violet-500"  />, unit: 'minutes'   },
  two_fa_expiry_minutes:            { label: "Validité du code 2FA SMS",                  hint: "Durée avant expiration du code de double authentification par SMS.",                  type: 'number', icon: <ShieldCheck size={14} className="text-indigo-500" />, unit: 'minutes'   },
  max_login_attempts:               { label: "Tentatives de connexion max",               hint: "Nombre de tentatives échouées avant blocage temporaire du compte.",                   type: 'number', icon: <Lock       size={14} className="text-red-500"     />, unit: 'tentatives'},
  certificat_validite_defaut_jours: { label: "Validité par défaut des certificats",       hint: "Durée appliquée lors de la signature d'un certificat si non spécifiée.",              type: 'number', icon: <FileCheck2 size={14} className="text-emerald-600" />, unit: 'jours'     },
  rappel_expiration_jours:          { label: "Rappel avant expiration certificat",         hint: "Nombre de jours avant expiration où un email/SMS de rappel est envoyé.",             type: 'number', icon: <Bell       size={14} className="text-orange-500"  />, unit: 'jours'     },
  validation_token_expiry_hours:    { label: "Validité du token de validation certificat", hint: "Durée avant expiration du lien de validation envoyé à l'utilisateur.",               type: 'number', icon: <BadgeCheck size={14} className="text-teal-500"    />, unit: 'heures'    },
  password_reset_expiry_hours:      { label: "Validité du lien de réinitialisation",       hint: "Durée avant expiration du lien de réinitialisation de mot de passe.",                type: 'number', icon: <RotateCcw  size={14} className="text-slate-500"   />, unit: 'heures'    },
};

const GROUPS = [
  { title: 'Récépissés',               keys: ['delai_expiration_defaut', 'entite_code'] },
  { title: 'Session & Authentification', keys: ['session_timeout_minutes', 'otp_expiry_minutes', 'two_fa_expiry_minutes', 'max_login_attempts'] },
  { title: 'Certificats',               keys: ['certificat_validite_defaut_jours', 'rappel_expiration_jours', 'validation_token_expiry_hours', 'password_reset_expiry_hours'] },
];

const ALL_KNOWN_KEYS = GROUPS.flatMap((g) => g.keys);

const ROLE_OPTIONS = [
  { value: 'ADMIN',       label: 'Admin global',   desc: 'Accès complet, toutes entités' },
  { value: 'AE_CENTRALE', label: 'AE Centrale',    desc: "Gestion d'une AE Centrale" },
  { value: 'ADMIN_AEL',   label: 'Admin AEL',      desc: "Administration d'une AEL" },
  { value: 'AEL',         label: 'Opérateur AEL',  desc: 'Traitement des demandes AEL' },
];

export default function SuperAdminSettingsPage() {
  const { addToast } = useToast();

  // Paramètres
  const [parametres, setParametres] = useState<Parametre[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});

  // Admin creation
  const [entites, setEntites] = useState<any[]>([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', telephone: '', role: 'ADMIN', entiteId: '' });
  const [busyAdmin, setBusyAdmin] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<{ email: string; role: string; tempPassword: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
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
      setLoading(false);
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
    if (!form.email.trim())     { setAdminError("L'email est requis."); return; }
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
    if (!createdAdmin) return;
    navigator.clipboard.writeText(createdAdmin.tempPassword);
    addToast({ type: 'success', message: 'Mot de passe copié !' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  const ParamRow = ({ p }: { p: Parametre }) => {
    const meta = LABELS[p.cle];
    const fb   = feedback[p.cle];
    return (
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {meta?.icon ?? <Settings2 size={14} />}
            {meta?.label ?? p.cle}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{meta?.hint ?? p.description}</p>
          {fb && (
            <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${fb.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fb.ok ? <CheckCircle size={11} /> : <AlertCircle size={11} />} {fb.msg}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1.5">
            <input
              type={meta?.type ?? 'text'}
              min={meta?.type === 'number' ? 1 : undefined}
              value={values[p.cle] ?? ''}
              onChange={(ev) => setValues((v) => ({ ...v, [p.cle]: ev.target.value }))}
              className="pki-input text-center"
              style={{ width: meta?.type === 'number' ? '80px' : '130px' }}
            />
            {meta?.unit && <span className="text-xs text-slate-400 whitespace-nowrap">{meta.unit}</span>}
          </div>
          <button onClick={() => save(p.cle)} disabled={saving === p.cle} className="btn btn-green" style={{ padding: '6px 14px', fontSize: '12px' }}>
            {saving === p.cle ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
            Sauver
          </button>
        </div>
      </div>
    );
  };

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
            <p className="mt-0.5 text-sm text-white/60">Paramètres appliqués à l'ensemble de la plateforme ANTIC PKI.</p>
          </div>
        </div>
      </div>

      {/* ── Paramètres système ── */}
      <section className="space-y-5">
        <div className="section-title">
          <div className="flex items-center gap-2">
            <Settings2 size={15} className="text-slate-500" />
            <span>Paramètres système</span>
          </div>
        </div>

        {parametres.length === 0 ? (
          <div className="pki-card p-8 text-center text-sm text-slate-400">Aucun paramètre disponible.</div>
        ) : (
          <>
            {GROUPS.map((group) => {
              const rows = parametres.filter((p) => group.keys.includes(p.cle));
              if (rows.length === 0) return null;
              return (
                <div key={group.title}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.title}
                  </p>
                  <div className="pki-card overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
                    {rows.map((p) => <ParamRow key={p.cle} p={p} />)}
                  </div>
                </div>
              );
            })}

            {/* Paramètres non catégorisés */}
            {parametres.filter((p) => !ALL_KNOWN_KEYS.includes(p.cle)).length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Autres</p>
                <div className="pki-card overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
                  {parametres.filter((p) => !ALL_KNOWN_KEYS.includes(p.cle)).map((p) => <ParamRow key={p.cle} p={p} />)}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Créer un administrateur ── */}
      <section>
        <div className="section-title mb-4">
          <div className="flex items-center gap-2">
            <UserPlus size={15} className="text-violet-500" />
            <span>Créer un administrateur</span>
          </div>
        </div>

        {/* Mot de passe affiché après création */}
        {createdAdmin && (
          <div className="pki-card mb-4 overflow-hidden">
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
                <button onClick={copyPassword} className="btn btn-primary">
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
          <div className="flex items-start gap-3 border-b border-slate-100 bg-violet-50 px-5 py-4 dark:border-slate-700/60 dark:bg-violet-950/20">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-violet-500" />
            <p className="text-sm text-violet-700 dark:text-violet-300">
              <span className="font-semibold">Mot de passe auto-généré.</span>{' '}
              Aucune saisie requise — un mot de passe sécurisé est créé automatiquement et affiché ici après la création.
            </p>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-5 p-5">
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" placeholder="admin@exemple.cm" value={form.email} onChange={setField('email')} className="pki-input" required />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Téléphone <span className="text-xs font-normal text-slate-400">(optionnel)</span>
              </label>
              <input type="tel" placeholder="+237 6XX XXX XXX" value={form.telephone} onChange={setField('telephone')} className="pki-input" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Rôle <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    form.role === r.value
                      ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-950/30'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-600'
                  }`}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={setField('role')} className="mt-0.5 accent-emerald-600" />
                    <div>
                      <p className={`text-sm font-semibold ${form.role === r.value ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>{r.label}</p>
                      <p className="text-xs text-slate-400">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

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
                    Aucune entité active — créez-en une dans "Gérer les entités".
                  </p>
                )}
              </div>
            )}

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
