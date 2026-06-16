import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Moon, Sun } from 'lucide-react';
import { authService } from '../services/api';
import { useThemeStore } from '../stores/themeStore';

export default function ForgotPasswordPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse e-mail.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi de l'e-mail.");
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
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeft size={18} />
            Retour à la connexion
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center w-full max-w-md mx-auto px-6 py-8">
          {!submitted ? (
            <>
              <div className="mb-6 sm:mb-8">
                <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
                  Mot de passe oublié ?
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Saisissez l'adresse e-mail associée à votre compte, et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Saisissez votre adresse e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
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
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-gray-700 dark:text-gray-400 sm:text-start">
                Attendez, je me souviens de mon mot de passe…{' '}
                <Link to="/login" className="text-primary-500 hover:text-primary-600 dark:text-primary-400">
                  Cliquez ici
                </Link>
              </p>
            </>
          ) : (
            /* ── Success state ── */
            <div className="space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>

              <div>
                <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
                  E-mail envoyé !
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Un lien de réinitialisation a été envoyé à{' '}
                  <span className="font-semibold text-gray-800 dark:text-white/90">{email}</span>.
                  Vérifiez votre dossier spam si vous ne le recevez pas.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
                >
                  Retour à la connexion
                </Link>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setEmail(''); }}
                  className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Renvoyer un e-mail
                </button>
              </div>
            </div>
          )}
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
