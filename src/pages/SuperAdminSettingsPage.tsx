import { useEffect, useState } from 'react';
import { Settings2, Save, RefreshCw, CheckCircle, AlertCircle, Hash, Clock, UserPlus, Building2 } from 'lucide-react';
import { adminService } from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Button from '../components/Button';

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

const ADMIN_ROLES = ['ADMIN', 'AE_CENTRALE', 'ADMIN_AEL', 'AEL'];

export default function SuperAdminSettingsPage() {
  const { addToast } = useToast();

  const [parametres, setParametres] = useState<Parametre[]>([]);
  const [loadingParams, setLoadingParams] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const [entites, setEntites] = useState<any[]>([]);

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: '', firstName: '', lastName: '', role: 'ADMIN', entiteId: '', telephone: '',
  });
  const [busyAdmin, setBusyAdmin] = useState(false);

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
      addToast({ type: 'error', message: e?.message || 'Erreur de chargement des paramètres' });
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
      setFeedback((f) => ({ ...f, [cle]: { ok: true, msg: 'Paramètre sauvegardé.' } }));
      setTimeout(() => setFeedback((f) => ({ ...f, [cle]: undefined as any })), 3000);
    } catch (e: any) {
      setFeedback((f) => ({ ...f, [cle]: { ok: false, msg: e?.message || 'Erreur.' } }));
    } finally {
      setSaving(null);
    }
  };

  const handleCreateAdmin = async () => {
    setBusyAdmin(true);
    try {
      const result = await adminService.createAdminUser({
        email: adminForm.email,
        firstName: adminForm.firstName,
        lastName: adminForm.lastName,
        role: adminForm.role,
        entiteId: adminForm.entiteId || undefined,
        telephone: adminForm.telephone || undefined,
      });
      addToast({ type: 'success', message: result?.message || 'Administrateur créé avec succès' });
      setShowCreateAdmin(false);
      setAdminForm({ email: '', firstName: '', lastName: '', role: 'ADMIN', entiteId: '', telephone: '' });
    } catch (e: any) {
      addToast({ type: 'error', message: e?.message || 'Erreur lors de la création' });
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

      {/* ── Paramètres système ── */}
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
                    {fb.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                    {fb.msg}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Création d'administrateur ── */}
      <div className="pki-card p-6">
        <div className="section-title mb-4">
          <div className="flex items-center gap-2">
            <UserPlus size={15} className="text-violet-500" />
            <span>Créer un administrateur</span>
          </div>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Créez un compte administrateur avec un rôle et une entité assignés.
          Un mot de passe temporaire sera généré et envoyé par email.
        </p>
        <Button onClick={() => setShowCreateAdmin(true)}>
          <UserPlus size={15} className="mr-1.5" />
          Créer un administrateur
        </Button>
      </div>

      {/* Modal création admin */}
      <Modal
        open={showCreateAdmin}
        title="Créer un administrateur"
        onClose={() => setShowCreateAdmin(false)}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setShowCreateAdmin(false)}>Annuler</Button>
            <Button onClick={handleCreateAdmin} disabled={busyAdmin}>
              {busyAdmin ? 'Création...' : 'Créer'}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prénom *</label>
              <input
                className="input-field"
                value={adminForm.firstName}
                onChange={(e) => setAdminForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom *</label>
              <input
                className="input-field"
                value={adminForm.lastName}
                onChange={(e) => setAdminForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
            <input
              type="email"
              className="input-field"
              value={adminForm.email}
              onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Téléphone</label>
            <input
              type="tel"
              className="input-field"
              placeholder="+237 6XX XXX XXX"
              value={adminForm.telephone}
              onChange={(e) => setAdminForm((f) => ({ ...f, telephone: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Rôle *</label>
            <select
              className="input-field"
              value={adminForm.role}
              onChange={(e) => setAdminForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ADMIN_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {adminForm.role !== 'ADMIN' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Entité <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={adminForm.entiteId}
                onChange={(e) => setAdminForm((f) => ({ ...f, entiteId: e.target.value }))}
              >
                <option value="">— Sélectionner une entité —</option>
                {entites.filter((e) => e.isActive).map((e: any) => (
                  <option key={e.id} value={e.id}>{e.nom} ({e.code})</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/40 dark:bg-blue-950/20">
            <Building2 size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Un mot de passe temporaire sera généré automatiquement et envoyé par email à l'administrateur.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
