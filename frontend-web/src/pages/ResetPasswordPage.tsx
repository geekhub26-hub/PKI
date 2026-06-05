import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { authService } from '../services/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Lien de reinitialisation invalide ou expire');
    }
  }, [token]);

  const validatePassword = () => {
    if (!password.trim()) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Lien de reinitialisation invalide');
      return;
    }

    if (!validatePassword()) return;

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      addToast({ type: 'success', message: 'Mot de passe reinitialise avec succes' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Erreur lors de la reinitialisation';
      setError(errorMsg);
      addToast({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 dark:from-neutral-950 dark:via-slate-950 dark:to-indigo-950/30 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="space-y-6 rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-neutral-900">
            <div className="inline-block rounded-full bg-red-100 p-3 dark:bg-red-950/40">
              <Lock size={32} className="text-red-600 dark:text-red-300" />
            </div>
            <h1 className="text-h2 font-bold text-neutral-900 dark:text-neutral-100">Lien invalide</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Ce lien de reinitialisation est invalide ou a expire. Veuillez demander une nouvelle reinitialisation.
            </p>
            <Link to="/forgot-password" className="block">
              <Button variant="primary" className="w-full">
                Demander une reinitialisation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 dark:from-neutral-950 dark:via-slate-950 dark:to-indigo-950/30 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
          <ArrowLeft size={16} />
          Retour a la connexion
        </Link>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
          {!success ? (
            <>
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-white/20 p-3">
                    <Lock size={28} className="text-white" />
                  </div>
                </div>
                <h1 className="text-h2 text-center font-bold text-white">Nouveau mot de passe</h1>
                <p className="mt-2 text-center text-sm text-indigo-100">Creez un nouveau mot de passe securise</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-8">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 caracteres"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      disabled={loading}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:disabled:bg-neutral-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Confirmer le mot de passe</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirmer le mot de passe"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      disabled={loading}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:disabled:bg-neutral-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                  <strong>Conseils pour un mot de passe securise :</strong>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                    <li>Au moins 8 caracteres</li>
                    <li>Mix de majuscules et minuscules</li>
                    <li>Incluez des chiffres et symboles</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" loading={loading}>
                  Reinitialiser le mot de passe
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-6 bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-12 text-center dark:from-green-950/30 dark:to-emerald-950/30">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-950/40">
                  <Lock size={32} className="text-green-600 dark:text-green-300" />
                </div>
              </div>
              <h2 className="text-h3 font-bold text-green-800 dark:text-green-300">Mot de passe reinitialise</h2>
              <p className="text-green-700 dark:text-green-300/80">
                Votre mot de passe a ete modifie avec succes. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Redirection vers la page de connexion...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
