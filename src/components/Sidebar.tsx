import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { resolveAvatarSrc } from '../utils/avatar';
import {
  LayoutGrid, Award, FileText, CheckSquare, XCircle, Download,
  BarChart3, RefreshCw, Key, LogOut, ChevronRight,
  User, UserCog, Menu, X, ClipboardList, Settings2, ShieldCheck, Lock, BookOpen,
} from 'lucide-react';

const userLinks = [
  { to: '/dashboard',          label: 'Tableau de bord',    icon: LayoutGrid },
  { to: '/recepisses',         label: 'Mes récépissés',      icon: ClipboardList },
  { to: '/certificates',       label: 'Mes certificats',     icon: Award },
  { to: '/request-pipeline',   label: 'Demandes en cours',   icon: CheckSquare },
  { to: '/generate-csr',       label: 'Nouvelle demande',    icon: FileText },
  { to: '/requests',           label: 'Suivi de demande',    icon: CheckSquare },
  { to: '/revoke-certificate', label: 'Révoquer certificat', icon: XCircle },
  { to: '/download-crl',       label: 'Télécharger CRL',     icon: Download },
];

const adminLinks = [
  { to: '/admin/dashboard',          label: 'Dashboard',         icon: LayoutGrid },
  { to: '/admin/stats',              label: 'Statistiques',      icon: BarChart3 },
  { to: '/admin/recepisses/stats',   label: 'Récépissés',        icon: ClipboardList },
  { to: '/admin/requests',           label: 'Gérer demandes',    icon: CheckSquare },
  { to: '/admin/generate-ca',        label: 'Générer AC',        icon: Key },
  { to: '/admin/sign-csr',           label: 'Signer CSR',        icon: Award },
  { to: '/admin/generate-crl',       label: 'CRL / Rotation',    icon: RefreshCw },
  { to: '/admin/revoke-certificate', label: 'Révoquer cert.',    icon: XCircle },
  { to: '/admin/download-crl',       label: 'Télécharger CRL',   icon: Download },
  { to: '/admin/audit',              label: "Journal d'audit",   icon: FileText },
];

const superAdminLinks = [
  { to: '/superadmin/settings', label: 'Paramètres système', icon: Settings2 },
];

const ROLE_META: Record<string, { label: string; color: string; bg: string; darkBg: string; icon: React.ElementType }> = {
  SUPER_ADMIN: { label: 'Super Admin',    color: '#7C3AED', bg: 'rgba(124,58,237,0.1)',  darkBg: 'rgba(192,132,252,0.15)', icon: ShieldCheck },
  ADMIN:       { label: 'Administrateur', color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   darkBg: 'rgba(248,113,113,0.15)', icon: UserCog },
  AE_CENTRALE: { label: 'AE Centrale',   color: '#D97706', bg: 'rgba(217,119,6,0.1)',   darkBg: 'rgba(251,146,60,0.15)',  icon: UserCog },
  ADMIN_AEL:   { label: 'Admin AEL',     color: '#B45309', bg: 'rgba(180,83,9,0.1)',    darkBg: 'rgba(251,191,36,0.15)',  icon: UserCog },
  AEL:         { label: 'AEL',           color: '#047857', bg: 'rgba(4,120,87,0.1)',    darkBg: 'rgba(52,211,153,0.15)', icon: UserCog },
  USER:        { label: 'Utilisateur',   color: '#1D4ED8', bg: 'rgba(29,78,216,0.1)',   darkBg: 'rgba(96,165,250,0.15)', icon: User },
};

function getInitials(firstName?: string, lastName?: string) {
  const f = (firstName?.[0] ?? '').toUpperCase();
  const l = (lastName?.[0]  ?? '').toUpperCase();
  return f + l || '?';
}

export default function Sidebar() {
  const { user } = useAuthStore();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'AE_CENTRALE', 'ADMIN_AEL', 'AEL'];
  const isAdminLike = adminRoles.includes(user?.role ?? '');
  const links = isAdminLike ? adminLinks : userLinks;
  const role  = user?.role ?? 'USER';
  const meta  = ROLE_META[role] ?? ROLE_META.USER;
  const RoleIcon = meta.icon;

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <div className="sidebar flex h-full flex-col" style={{ width: 'var(--sidebar-w)' }}>

      {/* ── Logo + Brand ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-emerald-100 dark:border-white/[0.07]">
        <div className="relative flex-shrink-0">
          <img
            src="/logo.jpeg"
            alt="ANTIC"
            className="h-11 w-11 rounded-xl object-cover ring-1 ring-emerald-100 dark:ring-white/10"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight leading-none">PKI</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-400/15 px-1.5 py-0.5 rounded-full leading-none">
              Souverain
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-none truncate">ANTIC Cameroun</div>
        </div>
        {/* Close btn mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ml-auto rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white md:hidden transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── User card ────────────────────────────────────── */}
      <div className="mx-3 mt-4 p-3 user-card flex items-center gap-3">
        {resolveAvatarSrc(user?.avatarUrl) ? (
          <img src={resolveAvatarSrc(user?.avatarUrl)!} alt="avatar"
            className="avatar h-9 w-9 flex-shrink-0 object-cover object-top"
            style={{ border: `1.5px solid ${meta.color}40` }} />
        ) : (
          <div
            className="avatar h-9 w-9 text-sm flex-shrink-0"
            style={{ background: meta.bg, color: meta.color, border: `1.5px solid ${meta.color}40` }}
          >
            {getInitials(user?.firstName, user?.lastName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-800 dark:text-white leading-tight">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="mt-1">
            <span
              className="role-pill"
              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}
            >
              <RoleIcon size={9} />
              {meta.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <div className="mt-5 px-3">
        <span className="mb-2 block px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {isAdminLike ? 'Administration' : 'Navigation'}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: 'none' }}>
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={clsx('nav-item mb-0.5', active && 'active')}
            >
              <Icon
                size={16}
                className="flex-shrink-0"
                style={{ color: active ? '#FFFFFF' : undefined }}
              />
              <span className="flex-1 truncate">{link.label}</span>
              {active && (
                <ChevronRight size={14} className="flex-shrink-0 opacity-60" />
              )}
            </Link>
          );
        })}

        {/* Super Admin section */}
        {role === 'SUPER_ADMIN' && (
          <>
            <div className="my-3 border-t border-emerald-100 dark:border-white/[0.07]" />
            <div className="mb-2 px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400/80">
                Système
              </span>
            </div>
            {superAdminLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={clsx('nav-item mb-0.5', active && 'active')}
                  style={active ? { background: 'rgba(124,58,237,0.12)', borderColor: 'rgba(124,58,237,0.25)', color: '#7C3AED' } : {}}
                >
                  <Icon
                    size={16}
                    className="flex-shrink-0"
                    style={{ color: active ? '#7C3AED' : undefined }}
                  />
                  <span className="flex-1 truncate">{link.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* ── PKI Trust indicator ──────────────────────────── */}
      <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg px-3 py-2.5 bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-500/20">
        <Lock size={13} className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Connexion sécurisée TLS</span>
        <div className="ml-auto h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* ── Profile + Logout ─────────────────────────────── */}
      <div className="border-t border-emerald-100 dark:border-white/[0.07] px-3 py-3 space-y-0.5">
        <Link
          to="/docs"
          className={clsx('nav-item mb-0.5', isActive('/docs') && 'active')}
        >
          <BookOpen
            size={16}
            className="flex-shrink-0"
            style={{ color: isActive('/docs') ? '#FFFFFF' : undefined }}
          />
          <span className="flex-1 truncate">Documentation</span>
          {isActive('/docs') && <ChevronRight size={14} className="flex-shrink-0 opacity-60" />}
        </Link>
        <Link
          to="/profile"
          className={clsx('nav-item mb-0.5', isActive('/profile') && 'active')}
        >
          <User
            size={16}
            className="flex-shrink-0"
            style={{ color: isActive('/profile') ? '#FFFFFF' : undefined }}
          />
          <span className="flex-1 truncate">Mon profil</span>
          {isActive('/profile') && <ChevronRight size={14} className="flex-shrink-0 opacity-60" />}
        </Link>
        <button
          onClick={handleLogout}
          className="nav-item w-full text-red-500 hover:!text-red-600 hover:!bg-red-50 dark:text-rose-300 dark:hover:!text-rose-200 dark:hover:!bg-rose-900/20"
        >
          <LogOut size={16} className="flex-shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-xl border border-emerald-100 bg-white p-2.5 text-slate-700 shadow-sm md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        aria-label="Ouvrir le menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer"
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:h-screen md:flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}
