export type NotifyType = 'success' | 'error' | 'info';

export function notify(type: NotifyType, message: string, duration?: number) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('app-toast', {
    detail: { type, message, duration },
  });
  window.dispatchEvent(event);
}
