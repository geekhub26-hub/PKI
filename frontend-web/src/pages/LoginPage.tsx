import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Input from '../components/Input';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';
import { notify } from '../utils/notify';
import { Shield, LogIn, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      notify('success', 'Connexion reussie.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou mot de passe invalide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--brand-500)_24%,transparent)] blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--brand-700)_20%,transparent)] blur-3xl animate-float" />

      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow-strong)] animate-fade-slide">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)]">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-extrabold text-[var(--text-1)]">Connexion</h1>
          <p className="text-sm text-[var(--text-3)]">Accedez a votre compte PKI Souverain</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            required
          />

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={<LogIn size={18} />}
            iconPosition="right"
          >
            Se connecter
          </Button>

          <div className="text-center">
            <Link to="/forgot-password" className="text-sm font-semibold text-[var(--brand-600)]">
              Mot de passe oublie ?
            </Link>
          </div>
        </form>

        <div className="my-6 h-px bg-[var(--border)]" />

        <Button onClick={() => navigate('/register')} variant="outline" size="lg" fullWidth>
          Creer un compte
        </Button>

        <p className="mt-5 text-center text-sm text-[var(--text-3)]">
          Probleme de connexion ? <a href="#" className="font-semibold text-[var(--brand-600)]">Contactez le support</a>
        </p>
      </div>
    </div>
  );
}
