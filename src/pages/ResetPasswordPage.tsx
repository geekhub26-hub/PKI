import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { authService } from '../services/api';
import { useThemeStore } from '../stores/themeStore';

/* ── Shared decorative helpers ── */

function GridDecor() {
  return (
    <svg viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full opacity-60">
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
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <circle cx="80" cy="80" r="70" fill="#D1FAE5" className="dark:fill-emerald-950/60" />
      <circle cx="80" cy="80" r="55" fill="#A7F3D0" className="dark:fill-emerald-900/60" />
      <circle cx="80" cy="80" r="38" fill="#10B981" />
      <path d="M58 80l14 14 30-30" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ErrorIllustration() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <circle cx="80" cy="80" r="70" fill="#FEE2E2" className="dark:fill-red-950/60" />
      <circle cx="80" cy="80" r="55" fill="#FECACA" className="dark:fill-red-900/60" />
      <circle cx="80" cy="80" r="38" fill="#EF4444" />
      <path d="M68 68l24 24M92 68l-24 24" stroke="white" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  );
}

function FullPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white p-6 dark:bg-gray-900">
      <div className="pointer-events-none absolute right-0 top-0 -z-10 w-full max-w-[250px] xl:max-w-[450px]">
        <GridDecor />
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 -z-10 w-full max-w-[250px] rotate-180 xl:max-w-[450px]">
        <GridDecor />
      </div>
      <div className="mx-auto w-full max-w-[274px] text-center sm:max-w-[555px]">
        {children}
      </div>
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400">
        © 2026 - PKI Souverain
      </p>
    </div>
  );
}

/* ── Main component ── */

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useThemeStore();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Lien de réinitialisation invalide ou expiré.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder-white/30 dark:focus:border-primary-700';

  /* ── Token absent ── */
  if (!token) {
    return (
      <FullPageLayout>
        <div className="mx-auto mb-10 w-full max-w-[100px] sm:max-w-[160px]">
          <ErrorIllustration />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white/90 xl:text-4xl">
          LIEN INVALIDE
        </h1>
        <p className="mb-6 mt-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
          Ce lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.
        </p>
        <Link
          to="/forgot-password"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          Demander un nouveau lien
        </Link>
      </FullPageLayout>
    );
  }

  /* ── Success ── */
  if (success) {
    return (
      <FullPageLayout>
        <div className="mx-auto mb-10 w-full max-w-[100px] sm:max-w-[160px]">
          <SuccessIllustration />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white/90 xl:text-4xl">
          SUCCÈS !
        </h1>
        <p className="mb-6 mt-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
          Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          Se connecter maintenant
        </Link>
      </FullPageLayout>
    );
  }

  /* ── Form ── */
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-gray-900 lg:flex-row">

      {/* LEFT PANEL */}
      <div className="flex flex-1 flex-col overflow-y-auto lg:w-1/2">
        <div className="w-full max-w-md mx-auto px-6 pt-6 sm:pt-10">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeft size={18} />
            Retour à la connexion
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center w-full max-w-md mx-auto px-6 py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Créez un nouveau mot de passe sécurisé pour votre compte.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  required
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
              <span className="font-semibold">Conseils :</span>
              <ul className="mt-1.5 list-inside list-disc space-y-1">
                <li>Au moins 8 caractères</li>
                <li>Mix de majuscules et minuscules</li>
                <li>Incluez des chiffres et symboles</li>
              </ul>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden items-center justify-center bg-primary-900 dark:bg-white/5 lg:flex lg:w-1/2">
        <div className="relative flex flex-col items-center max-w-xs px-8 text-center">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-700/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary-800/30 blur-3xl" />
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 className="mb-3 text-xl font-bold text-white">PKI Souverain</h2>
          <p className="text-sm leading-relaxed text-gray-400 dark:text-white/60">
            Infrastructure à clé publique souveraine du Cameroun. Émettez, gérez et révoquez vos certificats numériques X.509 en toute sécurité.
          </p>
        </div>
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Basculer le thème"
        className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition hover:bg-primary-700 sm:inline-flex"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
}
