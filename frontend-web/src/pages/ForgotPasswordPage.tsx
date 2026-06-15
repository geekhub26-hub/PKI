import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useToast } from '../components/Toast';
import { authService } from '../services/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      addToast({ type: 'error', message: 'Veuillez entrer votre email' });
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      addToast({ type: 'success', message: 'Email de réinitialisation envoyé avec succès' });
    } catch (error: any) {
      console.error('Erreur:', error);
      addToast({ type: 'error', message: 'Erreur lors de l\'envoi de l\'email' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Bouton retour */}
        <Link to="/login" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm mb-8 transition">
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {!submitted ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Mail size={28} className="text-white" />
                  </div>
                </div>
                <h1 className="text-h2 font-bold text-white text-center">Réinitialiser le mot de passe</h1>
                <p className="text-indigo-100 text-center text-sm mt-2">
                  Entrez votre adresse email pour recevoir un lien de réinitialisation
                </p>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <Input
                  label="Email"
                  type="email"
                  placeholder="Votre email"
                  value={email}
                  onChange={setEmail}
                  disabled={loading}
                  icon={<Mail size={18} />}
                />

                <Button
                  type="submit"
                  className="w-full"
                  loading={loading}
                >
                  Envoyer le lien de réinitialisation
                </Button>

                <p className="text-center text-sm text-neutral-600">
                  N'avez pas reçu d'email ? Vérifiez votre dossier spam
                </p>
              </form>
            </>
          ) : (
            <>
              {/* Message de succès */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-12 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Mail size={32} className="text-green-600" />
                  </div>
                </div>
                <h2 className="text-h3 font-bold text-green-800">Email envoyé avec succès</h2>
                <p className="text-green-700">
                  Un email contenant le lien de réinitialisation a été envoyé à <span className="font-semibold">{email}</span>
                </p>
                <p className="text-sm text-green-600">
                  Le lien expire dans 24 heures. Vérifiez votre dossier spam si vous ne le voyez pas.
                </p>

                <div className="pt-4 space-y-3">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/login')}
                    className="w-full"
                  >
                    Retour à la connexion
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEmail('');
                      setSubmitted(false);
                    }}
                    className="w-full"
                  >
                    Renvoyer un email
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
