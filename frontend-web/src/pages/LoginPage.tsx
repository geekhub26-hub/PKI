import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { authService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { notify } from '../utils/notify';

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { theme, toggleTheme } = useThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      notify('success', 'Connexion réussie.');
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe invalide.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder-white/30 dark:focus:border-primary-700';

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-gray-900 lg:flex-row">

      {/* ── LEFT PANEL ── */}
      <div className="flex flex-1 flex-col overflow-y-auto lg:w-1/2">
        <div className="w-full max-w-md mx-auto px-6 pt-6 sm:pt-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeft size={18} />
            Retour à l'accueil
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center w-full max-w-md mx-auto px-6 py-8">
          {/* Heading */}
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
              Se connecter
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Saisissez votre adresse e-mail et votre mot de passe pour vous connecter !
            </p>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M18.75 10.19c0-.72-.06-1.25-.19-1.79H10.18v3.25h4.92c-.1.81-.63 2.02-1.82 2.84l-.02.11 2.65 2.01.18.02C17.78 15.1 18.75 12.86 18.75 10.19Z" fill="#4285F4"/>
                <path d="M10.18 18.75c2.41 0 4.43-.78 5.91-2.12l-2.82-2.14c-.75.51-1.76.87-3.09.87-2.36 0-4.37-1.53-5.08-3.63l-.1.01-2.76 2.09-.04.1C3.67 16.79 6.69 18.75 10.18 18.75Z" fill="#34A853"/>
                <path d="M5.1 11.73c-.19-.55-.3-1.13-.3-1.73s.11-.58.29-1.13L2.29 6.93l-.08.04A8.75 8.75 0 0 0 1.25 10c0 1.41.34 2.74.96 3.93L5.1 11.73Z" fill="#FBBC05"/>
                <path d="M10.18 4.63c1.68 0 2.81.71 3.45 1.3l2.52-2.41C14.6 2.12 12.59 1.25 10.18 1.25 6.69 1.25 3.67 3.21 2.2 6.07l2.89 2.2c.72-2.11 2.73-3.64 5.09-3.64Z" fill="#EB4335"/>
              </svg>
              Se connecter avec Google
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
            >
              <svg width="20" height="20" viewBox="0 0 21 20" fill="currentColor">
                <path d="M15.67 1.875H18.43L12.4 8.758l7.08 9.367h-5.55L7.6 12.444l-4.97 5.681H.86l6.44-7.362L1.51 1.875h5.69l3.93 5.192 4.54-5.192Zm-1.02 15.6H16.23L6.37 3.438H4.73L14.65 17.475Z"/>
              </svg>
              Se connecter avec X
            </button>
          </div>

          {/* Divider */}
          <div className="relative py-4 sm:py-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 py-1 text-gray-400 dark:bg-gray-900 dark:text-gray-500 sm:px-5 sm:py-2">
                Ou
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="info@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Saisissez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-primary-600 dark:border-gray-700"
                />
                <label htmlFor="remember" className="cursor-pointer text-sm text-gray-700 dark:text-gray-400">
                  Rester connecté
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400"
              >
                Mot de passe oublié ?
              </Link>
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
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-700 dark:text-gray-400 sm:text-start">
            Vous n'avez pas de compte ?{' '}
            <Link to="/register" className="text-primary-500 hover:text-primary-600 dark:text-primary-400">
              Inscrivez-vous
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
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

      {/* ── Dark mode toggle ── */}
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
