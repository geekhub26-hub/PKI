import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Moon, Sun } from 'lucide-react';

function GridDecor() {
  return (
    <svg viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full opacity-50">
      {Array.from({ length: 10 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={col * 50 + 25}
            cy={row * 45 + 25}
            r="2"
            fill="currentColor"
            className="text-gray-300 dark:text-gray-700"
          />
        ))
      )}
    </svg>
  );
}

function SuccessIllustration() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-md">
      {/* Outer glow ring */}
      <circle cx="80" cy="80" r="72" fill="#D1FAE5" className="dark:fill-emerald-950/70" />
      {/* Middle ring */}
      <circle cx="80" cy="80" r="56" fill="#A7F3D0" className="dark:fill-emerald-900/60" />
      {/* Inner solid circle */}
      <circle cx="80" cy="80" r="40" fill="#10B981" />
      {/* Shield outline */}
      <path
        d="M80 52 L95 58.5 V74 C95 83.5 88 91.5 80 94.5 C72 91.5 65 83.5 65 74 V58.5 Z"
        fill="white"
        fillOpacity="0.18"
      />
      {/* Checkmark */}
      <path
        d="M64 79 L75 90 L96 68"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SuccessPage() {
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();

  const title   = searchParams.get('title')   ?? 'SUCCÈS !';
  const message = searchParams.get('message') ?? 'Votre action a été réalisée avec succès.';
  const href    = searchParams.get('href')    ?? (isAuthenticated ? '/dashboard' : '/login');
  const label   = searchParams.get('label')   ?? (isAuthenticated ? 'Retour au tableau de bord' : 'Se connecter');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white p-6 dark:bg-gray-900">

      {/* Corner dot grids */}
      <div className="pointer-events-none absolute right-0 top-0 -z-10 w-full max-w-[250px] xl:max-w-[420px]">
        <GridDecor />
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 -z-10 w-full max-w-[250px] rotate-180 xl:max-w-[420px]">
        <GridDecor />
      </div>

      {/* Card */}
      <div className="mx-auto w-full max-w-[280px] text-center sm:max-w-[520px]">

        {/* Illustration */}
        <div className="mx-auto mb-8 w-full max-w-[100px] sm:max-w-[150px]">
          <SuccessIllustration />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-800 dark:text-white/90 sm:text-4xl xl:text-5xl">
          {title}
        </h1>

        {/* Decorative separator */}
        <div className="mx-auto mb-5 h-1 w-16 rounded-full bg-emerald-400" />

        {/* Message */}
        <p className="mb-8 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
          {message}
        </p>

        {/* PKI badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          PKI Souverain — ANTIC Cameroun
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to={href}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {label}
          </Link>
          {isAuthenticated && href !== '/dashboard' && (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Tableau de bord
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center text-xs text-gray-400 dark:text-gray-600">
        © 2026 - PKI Souverain · ANTIC Cameroun
      </p>

      {/* Dark mode toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Basculer le thème"
        className="fixed bottom-6 right-6 z-50 hidden h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 sm:inline-flex"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
