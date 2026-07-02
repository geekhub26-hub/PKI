import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { Link } from 'react-router-dom';
import { Trash2, ChevronLeft, ChevronRight, Users, CheckCircle2, Ban } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

function rolePillClass(role: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
    case 'ADMIN':
      return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    default:
      return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }
}

export default function AdminManageUsersPage() {
  const user = useAuthStore((state) => state.user);
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete]       = useState<User | null>(null);
  const [deleting, setDeleting]               = useState(false);
  const { addToast } = useToast();

  const pageSize = 20;

  useEffect(() => { loadUsers(); }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(page, pageSize);
      setUsers(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      addToast({ type: 'error', message: 'Impossible de charger les utilisateurs' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (u: User) => {
    if (u.id === user?.id) {
      addToast({ type: 'error', message: 'Suppression de votre propre compte interdite.' });
      return;
    }
    setUserToDelete(u);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await adminService.deleteUser(userToDelete.id);
      addToast({ type: 'success', message: `Utilisateur ${userToDelete.email} supprimé.` });
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error || 'Erreur lors de la suppression' });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
            <h1 className="text-2xl font-bold text-white">Gestion des utilisateurs</h1>
            <p className="mt-0.5 text-sm text-white/60">Administration des comptes de la plateforme</p>
          </div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <ChevronLeft size={14} /> Retour
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      ) : (
        <>
          {/* Total KPI */}
          <div className="kpi-card blue" style={{ maxWidth: '240px' }}>
            <div className="kpi-icon blue"><Users size={22} /></div>
            <div className="kpi-body">
              <div className="kpi-value">{total}</div>
              <div className="kpi-label">Utilisateurs</div>
            </div>
          </div>

          {/* Table */}
          <div className="pki-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="pki-table" style={{ minWidth: '920px' }}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Nom complet</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th>Dernière connexion</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                        Aucun utilisateur.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <span className="font-mono text-xs">{u.email}</span>
                        </td>
                        <td className="font-medium">{u.firstName} {u.lastName}</td>
                        <td>
                          <span className={rolePillClass(u.role)}>{u.role}</span>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {u.isActive ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                            {u.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="text-sm text-slate-500">{formatDate(u.createdAt)}</td>
                        <td className="text-sm text-slate-500">{formatDate(u.lastLogin)}</td>
                        <td className="text-center">
                          <button
                            onClick={() => handleDeleteClick(u)}
                            disabled={u.id === user?.id}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              u.id === user?.id
                                ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                            }`}
                          >
                            <Trash2 size={12} /> Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <ChevronLeft size={15} /> Précédent
              </button>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Page {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
              >
                Suivant <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      {showDeleteModal && userToDelete && (
        <Modal
          open
          title="Confirmer la suppression"
          onClose={() => setShowDeleteModal(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Supprimer l'utilisateur{' '}
              <span className="font-bold text-slate-800 dark:text-slate-100">{userToDelete.email}</span> ?
            </p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                className="btn btn-primary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                onClick={confirmDelete}
                disabled={deleting}
              >
                <Trash2 size={14} /> {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
