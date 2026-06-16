import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

interface ThemeToggleProps {
  compact?: boolean;
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center rounded-lg border border-neutral-200 bg-white/80 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:bg-neutral-800 ${
        compact ? 'gap-1 px-2.5 py-2' : 'gap-2 px-3 py-2'
      }`}
      aria-label="Basculer le theme"
      title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      {!compact && <span>{theme === 'dark' ? 'Clair' : 'Sombre'}</span>}
    </button>
  );
}
