import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/Button';
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
      addToast({ type: 'success', message: `Utilisateur ${userToDelete.email} supprime.` });
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
    <div className="mx-auto max-w-7xl py-5">
      <header className="card mb-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[var(--brand-600)]">
              <Users size={18} />
              <span className="text-xs font-semibold uppercase tracking-wide">Administration</span>
            </div>
            <h1 className="text-h2 text-[var(--text-1)]">Gestion des utilisateurs</h1>
          </div>
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-600)]">
            <ChevronLeft size={15} /> Retour dashboard
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="card p-8 text-center text-[var(--text-3)]">Chargement...</div>
      ) : (
        <>
          <div className="card mb-4 p-4 text-sm text-[var(--text-2)]">Total utilisateurs: <span className="font-bold text-[var(--text-1)]">{total}</span></div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-[var(--surface-2)]">
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-3)]">
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Nom</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Cree le</th>
                    <th className="px-5 py-3">Derniere connexion</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-[var(--text-3)]">Aucun utilisateur.</td></tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-t border-[var(--border)] text-sm text-[var(--text-2)] hover:bg-[var(--surface-2)]/70">
                        <td className="px-5 py-4 font-mono text-xs text-[var(--text-1)]">{u.email}</td>
                        <td className="px-5 py-4">{u.firstName} {u.lastName}</td>
                        <td className="px-5 py-4"><span className="badge">{u.role}</span></td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold border border-[var(--border)] bg-[var(--surface-2)]">
                            {u.isActive ? <CheckCircle2 size={13} className="text-[var(--success-600)]" /> : <Ban size={13} className="text-[var(--danger-600)]" />}
                            {u.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-5 py-4">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-4">{formatDate(u.lastLogin)}</td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleDeleteClick(u)}
                            disabled={u.id === user?.id}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${u.id === user?.id ? 'cursor-not-allowed bg-[var(--surface-3)] text-[var(--text-3)]' : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--danger-600)] hover:bg-[var(--surface-3)]'}`}
                          >
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <Button variant="secondary" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
                <ChevronLeft size={16} /> Precedent
              </Button>
              <span className="text-sm text-[var(--text-3)]">Page {page + 1} / {totalPages}</span>
              <Button variant="secondary" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1}>
                Suivant <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}

      {showDeleteModal && userToDelete && (
        <Modal open={true} title="Confirmer la suppression" onClose={() => setShowDeleteModal(false)}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-2)]">Supprimer l utilisateur <span className="font-semibold text-[var(--text-1)]">{userToDelete.email}</span> ?</p>
            <p className="text-sm text-[var(--danger-600)]">Cette action est irreversible.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Annuler</Button>
              <Button variant="danger" onClick={confirmDelete} loading={deleting}>Supprimer</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
