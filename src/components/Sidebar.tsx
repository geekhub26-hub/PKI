import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutGrid, Award, FileText, CheckSquare, XCircle, Download,
  BarChart3, RefreshCw, Key, LogOut, ChevronRight,
  User, UserCog, Menu, X, ClipboardList, Settings2, ShieldCheck, Lock,
} from 'lucide-react';

const userLinks = [
  { to: '/dashboard',         label: 'Tableau de bord',   icon: LayoutGrid },
  { to: '/recepisses',        label: 'Mes récépissés',     icon: ClipboardList },
  { to: '/certificates',      label: 'Mes certificats',    icon: Award },
  { to: '/request-pipeline',  label: 'Demandes en cours',  icon: CheckSquare },
  { to: '/generate-csr',      label: 'Nouvelle demande',   icon: FileText },
  { to: '/requests',          label: 'Suivi de demande',   icon: CheckSquare },
  { to: '/revoke-certificate', label: 'Révoquer certificat', icon: XCircle },
  { to: '/download-crl',      label: 'Télécharger CRL',    icon: Download },
];

const adminLinks = [
  { to: '/admin/dashboard',         label: 'Dashboard',         icon: LayoutGrid },
  { to: '/admin/stats',             label: 'Statistiques',      icon: BarChart3 },
  { to: '/admin/recepisses/stats',  label: 'Récépissés',        icon: ClipboardList },
  { to: '/admin/requests',          label: 'Gérer demandes',    icon: CheckSquare },
  { to: '/admin/generate-ca',       label: 'Générer AC',        icon: Key },
  { to: '/admin/sign-csr',          label: 'Signer CSR',        icon: Award },
  { to: '/admin/generate-crl',      label: 'CRL / Rotation',    icon: RefreshCw },
  { to: '/admin/revoke-certificate', label: 'Révoquer cert.',   icon: XCircle },
  { to: '/admin/download-crl',      label: 'Télécharger CRL',   icon: Download },
  { to: '/admin/audit',             label: 'Journal d\'audit',  icon: FileText },
];

const superAdminLinks = [
  { to: '/superadmin/settings', label: 'Paramètres système', icon: Settings2 },
];

const ROLE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  SUPER_ADMIN: { label: 'Super Admin',  color: '#C084FC', bg: 'rgba(192,132,252,0.15)', icon: ShieldCheck },
  ADMIN:       { label: 'Administrateur', color: '#F87171', bg: 'rgba(248,113,113,0.15)', icon: UserCog },
  AE_CENTRALE: { label: 'AE Centrale',  color: '#FB923C', bg: 'rgba(251,146,60,0.15)',  icon: UserCog },
  ADMIN_AEL:   { label: 'Admin AEL',    color: '#FBBF24', bg: 'rgba(251,191,36,0.15)',  icon: UserCog },
  AEL:         { label: 'AEL',          color: '#34D399', bg: 'rgba(52,211,153,0.15)',  icon: UserCog },
  USER:        { label: 'Utilisateur',  color: '#60A5FA', bg: 'rgba(96,165,250,0.15)',  icon: User },
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
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.07]">
        <div className="logo-ring relative flex-shrink-0">
          <img
            src="/logo.jpeg"
            alt="ANTIC"
            className="h-11 w-11 rounded-xl object-cover"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-800 text-white tracking-tight leading-none">PKI</span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/15 px-1.5 py-0.5 rounded-full leading-none">Souverain</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 leading-none truncate">ANTIC Cameroun</div>
        </div>
        {/* Close btn mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ml-auto rounded-lg p-1 text-slate-400 hover:text-white md:hidden transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── User card ────────────────────────────────────── */}
      <div className="mx-3 mt-4 p-3 user-card flex items-center gap-3">
        <div
          className="avatar h-9 w-9 text-sm text-white flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${meta.color}60, ${meta.color}30)`, border: `1.5px solid ${meta.color}50` }}
        >
          {getInitials(user?.firstName, user?.lastName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white leading-tight">
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
        <span className="mb-2 block px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
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
              <Icon size={16} className="flex-shrink-0" style={{ color: active ? '#10B981' : undefined }} />
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
            <div className="my-3 border-t border-white/[0.07]" />
            <div className="mb-2 px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400/80">
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
                  style={active ? { background: 'rgba(192,132,252,0.15)', borderColor: 'rgba(192,132,252,0.25)' } : {}}
                >
                  <Icon size={16} className="flex-shrink-0" style={{ color: active ? '#C084FC' : undefined }} />
                  <span className="flex-1 truncate">{link.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* ── PKI Trust indicator ──────────────────────────── */}
      <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)' }}>
        <Lock size={13} className="flex-shrink-0 text-emerald-400" />
        <span className="text-[11px] font-medium text-emerald-300">Connexion sécurisée TLS</span>
        <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      {/* ── Logout ───────────────────────────────────────── */}
      <div className="border-t border-white/[0.07] px-3 py-3">
        <button
          onClick={handleLogout}
          className="nav-item w-full"
          style={{ color: '#FDA4AF' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
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
        className="fixed left-4 top-4 z-40 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-card md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
