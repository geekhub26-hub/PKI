import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
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
  tone?: 'danger' | 'info';
};

export default function TopBar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  const storageKey = user ? `pki_notifications_read_${user.id}` : 'pki_notifications_read';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        setReadIds(parsed);
        return;
      }
    } catch {
      // ignore
    }
    setReadIds([]);
  }, [storageKey]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        if (!user) return;
        if (user.role === 'ADMIN') {
          await adminService.getDashboard();
          if (!alive) return;
          const list = await adminService.getCertificateRequests('PENDING_REVIEW', 0, 5);
          if (!alive) return;
          setItems(
            (list?.items || []).map((r: any) => ({
              id: r.id,
              title: `Demande ${r.commonName || r.id}`,
              subtitle: r.submittedAt ? new Date(r.submittedAt).toLocaleString() : undefined,
              href: `/admin/requests/${r.id}`,
              tone: 'danger',
            }))
          );
        } else {
          const requests = await userService.getMyRequests();
          if (!alive) return;
          const actionable = requests.filter((r) => USER_ACTION_STATUSES.has(String(r.status || '').toUpperCase()));
          setItems(
            actionable.slice(0, 5).map((r) => ({
              id: r.id,
              title: `Demande ${r.commonName || r.id}`,
              subtitle: r.status === 'NEEDS_CORRECTION' ? 'Correction demandee' : 'CSR autorise',
              href: '/requests',
              tone: r.status === 'NEEDS_CORRECTION' ? 'danger' : 'info',
            }))
          );
        }
      } catch {
        if (!alive) return;
          setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    const id = window.setInterval(load, 30000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [user]);

  const goToNotifications = () => setOpen((v) => !v);
  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const unreadCount = items.filter((i) => !readSet.has(i.id)).length;
  const badgeClass =
    unreadCount > 0
      ? user?.role === 'ADMIN'
        ? 'bg-red-600'
        : 'bg-amber-500'
      : 'bg-neutral-400';

  const persistReadIds = (next: string[]) => {
    setReadIds(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const markAllRead = () => {
    const merged = Array.from(new Set([...readIds, ...items.map((i) => i.id)]));
    persistReadIds(merged);
  };

  return (
    <div className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90 md:rounded-2xl md:top-4 md:mx-4">
      <button
        type="button"
        onClick={goToNotifications}
        className="relative inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {!loading && unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[18px] rounded-full px-1.5 text-xs font-bold text-white ${badgeClass}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      <ThemeToggle />

      {open && (
        <div className="absolute right-4 top-14 w-80 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Notifications</div>
            <div className="flex items-center gap-2">
              <button
                className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                onClick={markAllRead}
              >
                Tout lire
              </button>
              <button
                className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                onClick={() => {
                  setOpen(false);
                  if (user?.role === 'ADMIN') navigate('/admin/requests');
                  else navigate('/requests');
                }}
              >
                Voir tout
              </button>
            </div>
          </div>
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-200 p-3 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              Aucune notification pour le moment.
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      if (!readSet.has(n.id)) {
                        persistReadIds(Array.from(new Set([...readIds, n.id])));
                      }
                      setOpen(false);
                      navigate(n.href);
                    }}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-sm text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-semibold">
                        {!readSet.has(n.id) && <span className="h-2 w-2 rounded-full bg-sky-500" />}
                        {n.title}
                      </span>
                      <span className={`text-[10px] font-bold ${n.tone === 'danger' ? 'text-red-600' : 'text-sky-600'}`}>
                        {n.tone === 'danger' ? 'URGENT' : 'INFO'}
                      </span>
                    </div>
                    {n.subtitle && <div className="text-xs text-neutral-500 dark:text-neutral-400">{n.subtitle}</div>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
