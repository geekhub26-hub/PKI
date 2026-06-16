import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Award,
  Globe,
  ChevronRight,
  Lock,
  Zap,
  Users,
  FileCheck2,
  Building2,
  KeyRound,
  BadgeCheck,
  Scale,
  Clock3,
  FileSearch,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';

/**
 * Page d'accueil (Landing Page)
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    ['Fonctionnalites', '#fonctionnalites'],
    ['Processus', '#processus'],
    ['FAQ', '#faq'],
    ['A propos', '#a-propos']
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-neutral-200/50 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center min-h-16 py-2 gap-3">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
                PKI Souverain
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="px-4 py-2 text-neutral-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors rounded-lg hover:bg-indigo-50/60 dark:hover:bg-slate-800/60"
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* Actions Desktop */}
            <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:inline-flex px-4 py-2 text-neutral-700 dark:text-slate-200 font-semibold hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                Connexion
              </button>
              <Button onClick={() => navigate('/register')} variant="primary" size="sm">
                S'inscrire
              </Button>
            </div>

            {/* Actions Mobile */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-neutral-700 dark:text-slate-200"
                aria-label="Ouvrir le menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-neutral-200/70 dark:border-slate-700 py-3">
              <nav className="flex flex-col gap-1 mb-3">
                {navItems.map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2 py-2 text-sm text-neutral-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Connexion
                </Button>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                  variant="primary"
                  size="sm"
                  className="flex-1"
                >
                  S'inscrire
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-16 md:py-24">
        {/* Background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 inline-flex items-center px-4 py-2 rounded-full bg-indigo-100/50 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800/60">
            <Zap className="h-4 w-4 text-indigo-600 mr-2" />
            <span className="text-sm font-semibold text-indigo-700">Infrastructure de confiance nationale</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
            Votre Identite Numerique
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
              Souveraine et Securisee
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-700 dark:text-slate-200 mb-12 max-w-2xl mx-auto leading-relaxed">
            Plateforme nationale de certification numerique conforme aux standards X.509.
            Demandez, suivez et recuperez vos certificats sur un parcours clair et verifiable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              onClick={() => navigate('/register')}
              variant="primary"
              size="lg"
              icon={<ChevronRight size={20} />}
              iconPosition="right"
            >
              Commencer maintenant
            </Button>
            <Button onClick={() => navigate('/login')} variant="outline" size="lg">
              J'ai deja un compte
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto py-8 sm:py-12">
            {[
              { icon: Lock, label: 'Chiffrement RSA 4096', desc: 'Securite bancaire' },
              { icon: Shield, label: 'Conforme X.509', desc: 'Standard international' },
              { icon: Users, label: '100% Souverain', desc: 'Sans tiers externe' }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-100 ring-1 ring-indigo-200/60 mb-3">
                  <stat.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">{stat.label}</div>
                <div className="text-xs text-neutral-600 dark:text-slate-300 mt-1">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-16 md:py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">Une infrastructure complete</h2>
            <p className="text-lg text-neutral-600 dark:text-slate-300 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gerer vos certificats numeriques de maniere fiable et securisee.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Securite renforcee',
                description: 'Cryptographie RSA 4096 bits et algorithmes certifies pour la protection maximale de vos donnees.'
              },
              {
                icon: Award,
                title: 'Conformite X.509',
                description: 'Standard international reconnu garantissant l interoperabilite avec vos systemes existants.'
              },
              {
                icon: Globe,
                title: 'Infrastructure souveraine',
                description: 'Hebergement maitrise et gouvernance locale, sans dependance a des autorites externes.'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="relative group rounded-xl border border-neutral-200 dark:border-slate-700 p-6 md:p-8 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-indigo-100 mb-6 group-hover:bg-indigo-200 transition-colors">
                    <feature.icon className="h-7 w-7 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-neutral-700 dark:text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="processus" className="py-16 md:py-20 bg-neutral-100/80 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">Comment ca marche</h2>
            <p className="text-lg text-neutral-600 dark:text-slate-300 max-w-3xl mx-auto">
              Un processus clair en 3 etapes: demande, verification administrative, puis emission du certificat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileCheck2,
                title: '1. Soumettre la demande',
                description: 'Renseignez vos informations, ajoutez votre piece d identite et envoyez la demande.'
              },
              {
                icon: FileSearch,
                title: '2. Verification admin',
                description: 'Un administrateur valide ou demande des corrections avec un motif explicite.'
              },
              {
                icon: KeyRound,
                title: '3. Signature et livraison',
                description: 'Apres validation, votre CSR est signee et le certificat est disponible dans votre espace.'
              }
            ].map((step, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-5">
                  <step.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-neutral-700 dark:text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 md:py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Scale,
                title: 'Traçabilite complete',
                text: 'Toutes les actions critiques sont journalisees (audit) pour faciliter le controle et la conformite.'
              },
              {
                icon: Clock3,
                title: 'Cycle de vie maitrise',
                text: 'Emission, suivi, renouvellement et revocation des certificats dans une seule plateforme.'
              },
              {
                icon: Building2,
                title: 'Gouvernance centralisee',
                text: 'Gestion admin des demandes, des statuts et de la chaine de certification.'
              }
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 dark:border-slate-700 p-6 bg-neutral-50 dark:bg-slate-950 hover:border-indigo-200 transition-colors">
                <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-neutral-700 dark:text-slate-300 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="a-propos" className="py-16 md:py-20 bg-neutral-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">Pourquoi choisir PKI Souverain ?</h2>
              <ul className="space-y-4">
                {[
                  'Parcours utilisateur guide avec etapes de verification',
                  'Validation administrative avant signature finale',
                  'Gestion de plusieurs demandes en parallele',
                  'Visualisation et telechargement des pieces jointes',
                  'Suivi clair des statuts et actions correctives',
                  'Controle centralise de la chaine de confiance'
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 mt-1">
                      <ChevronRight className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-lg text-neutral-700 dark:text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-900 rounded-2xl p-8 border border-indigo-100 dark:border-slate-700">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 mx-auto mb-6">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <p className="text-center text-neutral-800 dark:text-white font-semibold mb-4">Certificats numeriques PKI Souverain</p>
                <p className="text-center text-neutral-600 dark:text-slate-300">La solution de confiance pour votre identite numerique.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-20 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">FAQ</h2>
            <p className="text-lg text-neutral-600 dark:text-slate-300">Reponses rapides aux questions frequentes.</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: 'Combien de temps prend une demande ?',
                a: 'Le delai depend de la qualite des informations et des pieces fournies. Les statuts sont visibles en temps reel.'
              },
              {
                q: 'Puis-je faire plusieurs demandes ?',
                a: 'Oui. Vous pouvez gerer plusieurs demandes en parallele depuis la section Nouvelle demande.'
              },
              {
                q: 'Quels formats de pieces justificatives sont recommandes ?',
                a: 'JPG, PNG et PDF sont les plus adaptes pour la verification et l apercu dans l application.'
              },
              {
                q: 'Que se passe-t-il en cas de rejet ?',
                a: 'L administrateur laisse un motif de correction. Vous pouvez modifier puis resoumettre.'
              }
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-neutral-200 dark:border-slate-700 p-6 bg-neutral-50 dark:bg-slate-950 hover:border-indigo-200 transition-colors">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{item.q}</h3>
                    <p className="text-neutral-700 dark:text-slate-300 mt-2">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Commencez des maintenant</h2>
          <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
            Obtenez votre certificat numerique securise en quelques etapes.
          </p>
          <Button
            onClick={() => navigate('/register')}
            variant="primary"
            size="lg"
            className="bg-white text-indigo-600 hover:bg-indigo-50"
          >
            Creer mon compte
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 text-neutral-400 py-14 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
            <div className="lg:col-span-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
                  <Shield className="h-5 w-5 text-indigo-300" />
                </div>
                <span className="font-bold text-white text-lg">PKI Souverain</span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
                Plateforme nationale de certification numerique pour l emission, la gestion, la revocation
                et le suivi des certificats en environnement admin et utilisateur.
              </p>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-300" />
                  <span>Yaounde, Cameroun</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-300" />
                  <a href="mailto:support@pki.gov" className="hover:text-white transition">support@pki.gov</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-indigo-300" />
                  <span>+237 6 00 00 00 00</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-semibold text-white mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#fonctionnalites" className="hover:text-white transition">Fonctionnalites</a></li>
                <li><a href="#processus" className="hover:text-white transition">Processus</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#a-propos" className="hover:text-white transition">A propos</a></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li className="text-neutral-300">Generation CSR</li>
                <li className="text-neutral-300">Validation demandes</li>
                <li className="text-neutral-300">Emission certificats</li>
                <li className="text-neutral-300">Gestion CRL</li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-semibold text-white mb-4">Conformite</h4>
              <ul className="space-y-2 text-sm">
                <li className="text-neutral-300">X.509</li>
                <li className="text-neutral-300">Traçabilite audit</li>
                <li className="text-neutral-300">Gestion des roles</li>
                <li className="text-neutral-300">Politique de securite</li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-semibold text-white mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/login" className="hover:text-white transition inline-flex items-center gap-1">
                    Connexion <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a href="/register" className="hover:text-white transition inline-flex items-center gap-1">
                    Creer un compte <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li><a href="mailto:admin@pki.gov" className="hover:text-white transition">Contact admin</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-6 flex flex-col md:flex-row gap-3 md:gap-0 justify-between items-start md:items-center text-sm">
            <div>© 2026 PKI Souverain. Tous droits reserves.</div>
            <div className="flex gap-6">
              <span className="text-neutral-500">Version plateforme: v1.0</span>
              <span className="text-neutral-500">Etat service: Operationnel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

