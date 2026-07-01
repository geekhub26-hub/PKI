import { useEffect, useMemo, useState } from 'react';
import { Bell, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService, userService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import ThemeToggle from './ThemeToggle';

const USER_ACTION_STATUSES = new Set(['NEEDS_CORRECTION', 'REVIEW_APPROVED']);

type NotificationItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  tone?: 'danger' | 'info' | 'success';
};

function getInitials(firstName?: string, lastName?: string) {
  return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase() || '?';
}

export default function TopBar() {
  const navigate  = useNavigate();
  const user      = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [items,   setItems]   = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  const storageKey = user ? `pki_notifications_read_${user.id}` : 'pki_notifications_read';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { setReadIds(JSON.parse(raw)); return; }
    } catch { /* ignore */ }
    setReadIds([]);
  }, [storageKey]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        if (!user) return;
        if (user.role === 'ADMIN') {
          const list = await adminService.getCertificateRequests('PENDING_REVIEW', 0, 5);
          if (!alive) return;
          setItems((list?.items || []).map((r: any) => ({
            id: r.id,
            title: `Demande : ${r.commonName || r.id.slice(0, 8)}`,
            subtitle: r.submittedAt ? new Date(r.submittedAt).toLocaleString('fr-FR') : undefined,
            href: `/admin/requests/${r.id}`,
            tone: 'danger',
          })));
        } else {
          const requests = await userService.getMyRequests();
          if (!alive) return;
          const actionable = requests.filter((r) => USER_ACTION_STATUSES.has(String(r.status ?? '').toUpperCase()));
          setItems(actionable.slice(0, 5).map((r) => ({
            id: r.id,
            title: `Demande : ${r.commonName || r.id.slice(0, 8)}`,
            subtitle: r.status === 'NEEDS_CORRECTION' ? 'Correction requise' : 'CSR autorisé',
            href: '/requests',
            tone: r.status === 'NEEDS_CORRECTION' ? 'danger' : 'info',
          })));
        }
      } catch { if (alive) setItems([]); }
      finally  { if (alive) setLoading(false); }
    };
    load();
    const id = window.setInterval(load, 30_000);
    return () => { alive = false; window.clearInterval(id); };
  }, [user]);

  const readSet    = useMemo(() => new Set(readIds), [readIds]);
  const unreadCount = items.filter((i) => !readSet.has(i.id)).length;

  const persistRead = (next: string[]) => {
    setReadIds(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* */ }
  };
  const markAllRead = () => persistRead(Array.from(new Set([...readIds, ...items.map((i) => i.id)])));

  const toneStyle = (tone?: string) => {
    if (tone === 'danger')  return { dot: '#EF4444', label: 'URGENT', color: '#EF4444' };
    if (tone === 'success') return { dot: '#10B981', label: 'OK',     color: '#10B981' };
    return                         { dot: '#60A5FA', label: 'INFO',   color: '#60A5FA' };
  };

  return (
    <div className="topbar sticky top-0 z-30 flex items-center justify-end gap-2 px-6">

      {/* Page breadcrumb / title area — left side */}
      <div className="mr-auto flex items-center gap-2">
        <ShieldCheck size={15} className="text-emerald-500" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          PKI Souverain — ANTIC Cameroun
        </span>
      </div>

      {/* Notifications bell */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {!loading && unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <>
            <button
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            />
            <div className="absolute right-0 top-11 z-50 w-80 animate-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-hover dark:border-slate-700 dark:bg-slate-900">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</span>
                <div className="flex items-center gap-3">
                  <button onClick={markAllRead} className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition dark:hover:text-slate-200">
                    Tout lire
                  </button>
                  <button onClick={() => { setOpen(false); navigate(user?.role === 'ADMIN' ? '/admin/requests' : '/requests'); }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition">
                    Voir tout <ArrowRight size={11} />
                  </button>
                  <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="max-h-72 overflow-y-auto p-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Bell size={28} className="mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs text-slate-400 dark:text-slate-500">Aucune notification</p>
                  </div>
                ) : (
                  items.map((n) => {
                    const ts = toneStyle(n.tone);
                    const isRead = readSet.has(n.id);
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!isRead) persistRead(Array.from(new Set([...readIds, n.id])));
                          setOpen(false);
                          navigate(n.href);
                        }}
                        className="mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <div className="h-2 w-2 rounded-full" style={{ background: isRead ? '#CBD5E1' : ts.dot }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{n.title}</div>
                          {n.subtitle && <div className="mt-0.5 text-[11px] text-slate-400">{n.subtitle}</div>}
                        </div>
                        <span className="mt-0.5 text-[10px] font-bold" style={{ color: ts.color }}>{ts.label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Avatar */}
      <div className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #1E4A7E, #0A1E3D)' }}>
        {getInitials(user?.firstName, user?.lastName)}
      </div>
    </div>
  );
}
