import { useEffect, useRef, useState, RefObject } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, RefreshCw, ChevronLeft } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { Moon, Sun } from 'lucide-react';
import { authService } from '../services/api';

export default function OtpVerificationPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const { theme, toggleTheme } = useThemeStore();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);
  const o0 = useRef<HTMLInputElement>(null);
  const o1 = useRef<HTMLInputElement>(null);
  const o2 = useRef<HTMLInputElement>(null);
  const o3 = useRef<HTMLInputElement>(null);
  const o4 = useRef<HTMLInputElement>(null);
  const o5 = useRef<HTMLInputElement>(null);
  const refs: RefObject<HTMLInputElement>[] = [o0, o1, o2, o3, o4, o5];

  useEffect(() => { refs[0].current?.focus(); }, []);

  const code = digits.join('');

  const handleDigit = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      refs[5].current?.focus();
    }
  };

  const verify = async () => {
    if (code.length < 6) { setError('Entrez les 6 chiffres du code.'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.verifyOtp(email, code);
      navigate('/login?verified=1', { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setResent(false);
    try {
      await authService.resendOtp(email);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch {
      // silence — l'email peut avoir déjà été renvoyé
    } finally {
      setResending(false);
    }
  };

  const inputClass =
    'h-14 w-12 rounded-xl border border-gray-300 bg-transparent text-center text-xl font-bold text-gray-800 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-white dark:bg-gray-900 px-4">
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition hover:bg-primary-700 sm:inline-flex"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-md">
        <Link to="/register" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <ChevronLeft size={16} /> Retour à l'inscription
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950/40">
              <ShieldCheck size={32} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Vérification email</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Un code à 6 chiffres a été envoyé à<br />
              <span className="font-medium text-gray-800 dark:text-white/80">{email}</span>
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={inputClass}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {resent && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              Code renvoyé avec succès.
            </div>
          )}

          <button
            onClick={verify}
            disabled={loading || code.length < 6}
            className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Vérification...' : 'Confirmer mon email'}
          </button>

          <button
            onClick={resend}
            disabled={resending}
            className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {resending ? <RefreshCw size={14} className="animate-spin" /> : null}
            Renvoyer le code
          </button>
        </div>
      </div>
    </div>
  );
}
