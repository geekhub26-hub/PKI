import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, UserPlus, Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import Input from '../components/Input';
import Button from '../components/Button';
import { authService } from '../services/api';
import { notify } from '../utils/notify';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.register({ email, password, firstName, lastName });
      const auth = await authService.login({ email, password });
      setUser(auth.user);
      notify('success', 'Compte cree avec succes.');
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 p-4 dark:from-neutral-950 dark:via-slate-950 dark:to-indigo-950/30 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-indigo-200 opacity-20 blur-3xl filter mix-blend-multiply animate-blob dark:bg-indigo-900/40" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-100 opacity-20 blur-3xl filter mix-blend-multiply animate-blob animation-delay-2000 dark:bg-indigo-950/50" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">Creer un compte</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Rejoignez PKI Souverain en quelques minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Prenom" value={firstName} onChange={setFirstName} icon={<User size={18} />} required />
              <Input label="Nom" value={lastName} onChange={setLastName} icon={<User size={18} />} required />
            </div>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="votre@email.com"
              icon={<Mail size={18} />}
              required
            />

            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="********"
              icon={<Lock size={18} />}
              help="Au moins 8 caracteres"
              required
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={<UserPlus size={20} />}
              iconPosition="right"
            >
              S'inscrire
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">Vous avez un compte?</span>
            </div>
          </div>

          <Button onClick={() => navigate('/login')} variant="outline" size="lg" fullWidth>
            Se connecter
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
          En creant un compte, vous acceptez nos{' '}
          <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200">
            conditions d'utilisation
          </a>
        </p>
      </div>
    </div>
  );
}
