import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { Building2, Plus, UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';

interface Entite {
  id: string;
  code: string;
  nom: string;
  type: 'AE_CENTRALE' | 'AEL';
  isActive: boolean;
  parentId: string | null;
  parentNom: string | null;
  createdAt: string;
}

const ADMIN_ROLES = ['ADMIN', 'AE_CENTRALE', 'ADMIN_AEL', 'AEL'];

export default function AdminEntitesPage() {
  const user = useAuthStore((s) => s.user);
  const { addToast } = useToast();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: créer entité
  const [showCreateEntite, setShowCreateEntite] = useState(false);
  const [entiteForm, setEntiteForm] = useState({ code: '', nom: '', type: 'AEL', parentId: '' });
  const [busyEntite, setBusyEntite] = useState(false);

  // Modal: créer admin
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: '', firstName: '', lastName: '', role: 'AEL', entiteId: '', telephone: '',
  });
  const [busyAdmin, setBusyAdmin] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await adminService.listEntites();
      setEntites(data);
    } catch (e: any) {
      addToast({ type: 'error', message: e?.message || 'Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (e: Entite) => {
    if (!isSuperAdmin) return;
    try {
      await adminService.updateEntite(e.id, { isActive: (!e.isActive).toString() });
      addToast({ type: 'success', message: `Entité ${e.isActive ? 'désactivée' : 'activée'}` });
      load();
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Erreur' });
    }
  };

  const handleCreateEntite = async () => {
    setBusyEntite(true);
    try {
      await adminService.createEntite({
        code: entiteForm.code,
        nom: entiteForm.nom,
        type: entiteForm.type,
        parentId: entiteForm.parentId || undefined,
      });
      addToast({ type: 'success', message: 'Entité créée' });
      setShowCreateEntite(false);
      setEntiteForm({ code: '', nom: '', type: 'AEL', parentId: '' });
      load();
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Erreur création' });
    } finally {
      setBusyEntite(false);
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
      addToast({ type: 'success', message: result?.message || 'Admin créé' });
      setShowCreateAdmin(false);
      setAdminForm({ email: '', firstName: '', lastName: '', role: 'AEL', entiteId: '', telephone: '' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Erreur création admin' });
    } finally {
      setBusyAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">
              Administration PKI
            </p>
            <h1 className="text-2xl font-bold text-white">Gestion des entités</h1>
          </div>
          {isSuperAdmin && (
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateEntite(true)}>
                <Plus size={15} className="mr-1.5" />Nouvelle entité
              </Button>
              <Button variant="secondary" onClick={() => setShowCreateAdmin(true)}>
                <UserPlus size={15} className="mr-1.5" />Créer un admin
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table entités */}
      <div className="pki-card overflow-hidden">
        <div className="section-title px-6 pt-6">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-blue-500" />
            <span>Entités ({entites.length})</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Nom</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">Parent</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-500 dark:text-slate-400">Statut</th>
                {isSuperAdmin && (
                  <th className="px-4 py-3 text-center font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {entites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">Aucune entité</td>
                </tr>
              ) : entites.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{e.code}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{e.nom}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      e.type === 'AE_CENTRALE'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                    }`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{e.parentNom || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      e.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {e.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(e)}
                        title={e.isActive ? 'Désactiver' : 'Activer'}
                        className="text-slate-400 transition hover:text-blue-500"
                      >
                        {e.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: créer entité */}
      <Modal
        open={showCreateEntite}
        title="Nouvelle entité"
        onClose={() => setShowCreateEntite(false)}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setShowCreateEntite(false)}>Annuler</Button>
            <Button onClick={handleCreateEntite} disabled={busyEntite}>
              {busyEntite ? 'Création...' : 'Créer'}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Code *</label>
            <input
              className="input-field"
              placeholder="Ex: ANTIC, AEL_YAOUNDE"
              value={entiteForm.code}
              onChange={(e) => setEntiteForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom *</label>
            <input
              className="input-field"
              placeholder="Ex: Agence de l'Informatique"
              value={entiteForm.nom}
              onChange={(e) => setEntiteForm((f) => ({ ...f, nom: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type *</label>
            <select
              className="input-field"
              value={entiteForm.type}
              onChange={(e) => setEntiteForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="AE_CENTRALE">AE_CENTRALE</option>
              <option value="AEL">AEL</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Entité parente (optionnel)</label>
            <select
              className="input-field"
              value={entiteForm.parentId}
              onChange={(e) => setEntiteForm((f) => ({ ...f, parentId: e.target.value }))}
            >
              <option value="">— Aucune —</option>
              {entites.filter(e => e.isActive).map((e) => (
                <option key={e.id} value={e.id}>{e.nom} ({e.code})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal: créer admin */}
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
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Entité</label>
            <select
              className="input-field"
              value={adminForm.entiteId}
              onChange={(e) => setAdminForm((f) => ({ ...f, entiteId: e.target.value }))}
            >
              <option value="">— Aucune —</option>
              {entites.filter(e => e.isActive).map((e) => (
                <option key={e.id} value={e.id}>{e.nom} ({e.code})</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Un mot de passe temporaire sera généré et envoyé par email à l'administrateur.
          </p>
        </div>
      </Modal>
    </div>
  );
}
