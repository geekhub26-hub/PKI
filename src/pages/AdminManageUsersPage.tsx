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
    case 'SUPER_ADMIN': return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
    case 'ADMIN': return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    default: return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }
}

export default function AdminManageUsersPage() {
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  const pageSize = 20;

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(page, pageSize);
      setUsers(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
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
      console.error('Erreur lors de la suppression:', error);
      addToast({ type: 'error', message: error?.response?.data?.error || 'Erreur lors de la suppression' });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={28} className="text-white/80" />
          <div>
            <h1 className="text-2xl font-bold text-white">Gestion des utilisateurs</h1>
            <p className="mt-0.5 text-sm text-white/70">Administration des comptes</p>
          </div>
        </div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 text-sm font-semibold text-white"
        >
          <ChevronLeft size={15} /> Retour dashboard
        </Link>
      </div>

      {loading ? (
        <div className="pki-card p-8 text-center text-slate-500 dark:text-slate-400">Chargement...</div>
      ) : (
        <>
          {/* Total count info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 text-sm text-slate-600 dark:text-slate-300">
            Total utilisateurs : <span className="font-bold text-slate-800 dark:text-slate-100">{total}</span>
          </div>

          {/* Users table */}
          <div className="pki-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Nom</th>
                    <th className="px-5 py-3">Rôle</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Créé le</th>
                    <th className="px-5 py-3">Dernière connexion</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Aucun utilisateur.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-t border-slate-100 dark:border-slate-700/50 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-slate-800 dark:text-slate-100">{u.email}</td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{u.firstName} {u.lastName}</td>
                        <td className="px-5 py-4">
                          <span className={rolePillClass(u.role)}>{u.role}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${u.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'}`}>
                            {u.isActive
                              ? <CheckCircle2 size={13} />
                              : <Ban size={13} />}
                            {u.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(u.lastLogin)}</td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleDeleteClick(u)}
                            disabled={u.id === user?.id}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                              u.id === user?.id
                                ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                            }`}
                          >
                            <Trash2 size={13} /> Supprimer
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
                className="btn btn-primary"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <ChevronLeft size={16} className="inline -mt-0.5" /> Précédent
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Page {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn-primary"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
              >
                Suivant <ChevronRight size={16} className="inline -mt-0.5" />
              </button>
            </div>
          )}
        </>
      )}

      {showDeleteModal && userToDelete && (
        <Modal open={true} title="Confirmer la suppression" onClose={() => setShowDeleteModal(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Supprimer l'utilisateur{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-100">{userToDelete.email}</span> ?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Cette action est irréversible.</p>
            <div className="flex justify-end gap-3">
              <button
                className="btn btn-primary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
