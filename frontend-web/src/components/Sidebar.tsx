import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutGrid,
  Award,
  FileText,
  CheckSquare,
  XCircle,
  Download,
  BarChart3,
  RefreshCw,
  Key,
  LogOut,
  ChevronRight,
  Shield,
  User,
  UserCog,
  Menu,
  X,
} from 'lucide-react';

const userLinks = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutGrid },
  { to: '/certificates', label: 'Mes certificats', icon: Award },
  { to: '/request-pipeline', label: 'Demandes en cours', icon: CheckSquare },
  { to: '/generate-csr', label: 'Nouvelle demande', icon: FileText },
  { to: '/requests', label: 'Suivi de demande', icon: CheckSquare },
  { to: '/revoke-certificate', label: 'Revoquer certificat', icon: XCircle },
  { to: '/download-crl', label: 'Telecharger CRL', icon: Download },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/admin/stats', label: 'Statistiques', icon: BarChart3 },
  { to: '/admin/requests', label: 'Gerer demandes', icon: CheckSquare },
  { to: '/admin/generate-ca', label: 'Generer AC', icon: Key },
  { to: '/admin/sign-csr', label: 'Signer CSR', icon: Award },
  { to: '/admin/generate-crl', label: 'CRL/Rotation', icon: RefreshCw },
  { to: '/admin/revoke-certificate', label: 'Revoquer cert', icon: XCircle },
  { to: '/admin/download-crl', label: 'Telecharger CRL', icon: Download },
  { to: '/admin/audit', label: 'Journal audit', icon: FileText },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = user?.role === 'ADMIN' ? adminLinks : userLinks;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg border border-neutral-200 bg-white p-2 text-neutral-700 shadow md:hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        aria-label="Ouvrir le menu"
      >
        <Menu size={18} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-neutral-200 bg-white p-6 shadow-sm transition-transform duration-200 dark:border-neutral-800 dark:bg-neutral-900 md:static md:min-h-screen md:w-64 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 rounded p-1 text-neutral-600 md:hidden dark:text-neutral-300"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>

        <div className="mb-8 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">PKI</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Souverain</div>
          </div>
        </div>

        {user?.role === 'ADMIN' ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center dark:border-red-900/60 dark:bg-red-950/40">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
              <UserCog size={14} /> ADMINISTRATEUR
            </div>
            <div className="mt-0.5 text-xs text-red-600 dark:text-red-300/80">{user?.email}</div>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center dark:border-blue-900/60 dark:bg-blue-950/40">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
              <User size={14} /> UTILISATEUR
            </div>
            <div className="mt-0.5 text-xs text-blue-600 dark:text-blue-300/80">{user?.email}</div>
          </div>
        )}

        <nav className="mb-8 flex-1 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  'flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-200',
                  active
                    ? 'border border-indigo-200 bg-indigo-50 font-semibold text-indigo-700 shadow-sm dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium">{link.label}</span>
                {active && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="mb-6 border-t border-neutral-200 dark:border-neutral-800" />

        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 transition-all duration-200 hover:border-red-300 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
        >
          <span className="flex items-center space-x-3 font-medium">
            <LogOut size={18} className="flex-shrink-0" />
            <span className="text-sm">Deconnexion</span>
          </span>
        </button>
      </aside>
    </>
  );
}
