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
import ThemeToggle from '../components/ThemeToggle';

const NAV_ITEMS: [string, string][] = [
  ['Fonctionnalités', 'fonctionnalites'],
  ['Processus',       'processus'],
  ['FAQ',             'faq'],
  ['À propos',        'a-propos'],
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-slate-950">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-emerald-100 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center min-h-16 py-2 gap-3">

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 shadow-md shadow-emerald-800/30">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-base sm:text-xl font-extrabold bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent tracking-tight">
                PKI Souverain
              </span>
            </div>

            {/* Nav desktop */}
            <nav className="hidden md:flex space-x-1">
              {NAV_ITEMS.map(([label, id]) => (
                <button
                  key={label}
                  onClick={() => scrollTo(id)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors rounded-full hover:bg-emerald-50 dark:hover:bg-slate-800"
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Actions desktop */}
            <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:inline-flex px-4 py-2 text-slate-600 dark:text-slate-200 font-semibold hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors rounded-full"
              >
                Connexion
              </button>
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-800/30 hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-800/40 hover:-translate-y-px"
              >
                S'inscrire
              </button>
            </div>

            {/* Actions mobile */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-200"
                aria-label="Ouvrir le menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-emerald-100 dark:border-slate-700 py-3">
              <nav className="flex flex-col gap-1 mb-3">
                {NAV_ITEMS.map(([label, id]) => (
                  <button
                    key={label}
                    onClick={() => { scrollTo(id); setMobileMenuOpen(false); }}
                    className="px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800"
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                  className="flex-1 px-4 py-2 rounded-full border border-emerald-200 text-emerald-800 font-semibold text-sm hover:bg-emerald-50 transition"
                >
                  Connexion
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
                  className="flex-1 px-4 py-2 rounded-full bg-emerald-800 text-white font-semibold text-sm hover:bg-emerald-700 transition"
                >
                  S'inscrire
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-20 md:py-28">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200 rounded-full filter blur-3xl opacity-25" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-100 rounded-full filter blur-3xl opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/30 rounded-full filter blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-lg shadow-emerald-800/30">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-semibold">Infrastructure de confiance nationale</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
            Votre Identité Numérique
            <br />
            <span className="bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">
              Souveraine et Sécurisée
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Plateforme nationale de certification numérique conforme aux standards X.509.
            Demandez, suivez et récupérez vos certificats sur un parcours clair et vérifiable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-emerald-800 text-white font-semibold text-base shadow-lg shadow-emerald-800/35 hover:bg-emerald-700 transition-all hover:shadow-xl hover:shadow-emerald-800/45 hover:-translate-y-0.5"
            >
              Commencer maintenant
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-emerald-800 text-emerald-800 font-semibold text-base hover:bg-emerald-50 transition-all dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            >
              J'ai déjà un compte
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Lock,   label: 'Chiffrement RSA 4096', desc: 'Sécurité bancaire' },
              { icon: Shield, label: 'Conforme X.509',        desc: 'Standard international' },
              { icon: Users,  label: '100% Souverain',        desc: 'Sans tiers externe' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-800 shadow-md shadow-emerald-800/30 mb-1">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{stat.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
              Une infrastructure complète
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer vos certificats numériques de manière fiable et sécurisée.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Sécurité renforcée',
                description: 'Cryptographie RSA 4096 bits et algorithmes certifiés pour la protection maximale de vos données.',
              },
              {
                icon: Award,
                title: 'Conformité X.509',
                description: "Standard international reconnu garantissant l'interopérabilité avec vos systèmes existants.",
              },
              {
                icon: Globe,
                title: 'Infrastructure souveraine',
                description: 'Hébergement maîtrisé et gouvernance locale, sans dépendance à des autorités externes.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-emerald-100 dark:border-slate-700 p-8 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xl hover:shadow-emerald-800/10 transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-800 mb-6 shadow-md shadow-emerald-800/30 group-hover:bg-emerald-700 transition-colors">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ─────────────────────────────────────────── */}
      <section id="processus" className="py-20 bg-emerald-50/70 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
              Comment ça marche
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
              Un processus clair en 3 étapes : demande, vérification administrative, puis émission du certificat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileCheck2,
                title: '1. Soumettre la demande',
                description: 'Renseignez vos informations, ajoutez votre pièce d\'identité et envoyez la demande.',
              },
              {
                icon: FileSearch,
                title: '2. Vérification admin',
                description: 'Un administrateur valide ou demande des corrections avec un motif explicite.',
              },
              {
                icon: KeyRound,
                title: '3. Signature et livraison',
                description: 'Après validation, votre CSR est signée et le certificat est disponible dans votre espace.',
              },
            ].map((step, i) => (
              <div key={i} className="rounded-2xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm hover:shadow-lg hover:shadow-emerald-800/8 hover:border-emerald-200 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-800 flex items-center justify-center mb-5 shadow-md shadow-emerald-800/30">
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Cards ─────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Scale,
                title: 'Traçabilité complète',
                text: 'Toutes les actions critiques sont journalisées (audit) pour faciliter le contrôle et la conformité.',
              },
              {
                icon: Clock3,
                title: 'Cycle de vie maîtrisé',
                text: 'Émission, suivi, renouvellement et révocation des certificats dans une seule plateforme.',
              },
              {
                icon: Building2,
                title: 'Gouvernance centralisée',
                text: 'Gestion admin des demandes, des statuts et de la chaîne de certification.',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-emerald-100 dark:border-slate-700 p-6 bg-emerald-50/50 dark:bg-slate-950 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-lg hover:shadow-emerald-800/8 transition-all duration-300">
                <div className="w-11 h-11 rounded-2xl bg-emerald-800 flex items-center justify-center mb-4 shadow-sm shadow-emerald-800/30">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ────────────────────────────────────────── */}
      <section id="a-propos" className="py-20 bg-emerald-50/70 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-8 leading-tight tracking-tight">
                Pourquoi choisir PKI Souverain ?
              </h2>
              <ul className="space-y-4">
                {[
                  'Parcours utilisateur guidé avec étapes de vérification',
                  'Validation administrative avant signature finale',
                  'Gestion de plusieurs demandes en parallèle',
                  'Visualisation et téléchargement des pièces jointes',
                  'Suivi clair des statuts et actions correctives',
                  'Contrôle centralisé de la chaîne de confiance',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-800 mt-0.5 shadow-sm shadow-emerald-800/30">
                      <ChevronRight className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-emerald-600 rounded-3xl blur-3xl opacity-15 dark:opacity-25" />
              <div className="relative bg-gradient-to-br from-white to-emerald-50 dark:from-slate-900 dark:to-slate-900 rounded-3xl p-10 border border-emerald-100 dark:border-slate-700 shadow-xl shadow-emerald-800/10">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 mx-auto mb-6 shadow-xl shadow-emerald-800/40">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <p className="text-center text-slate-900 dark:text-white font-bold text-lg mb-3">
                  Certificats numériques PKI Souverain
                </p>
                <p className="text-center text-slate-500 dark:text-slate-400">
                  La solution de confiance pour votre identité numérique.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">FAQ</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">Réponses rapides aux questions fréquentes.</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: 'Combien de temps prend une demande ?',
                a: 'Le délai dépend de la qualité des informations et des pièces fournies. Les statuts sont visibles en temps réel.',
              },
              {
                q: 'Puis-je faire plusieurs demandes ?',
                a: 'Oui. Vous pouvez gérer plusieurs demandes en parallèle depuis la section Nouvelle demande.',
              },
              {
                q: 'Quels formats de pièces justificatives sont recommandés ?',
                a: "JPG, PNG et PDF sont les plus adaptés pour la vérification et l'aperçu dans l'application.",
              },
              {
                q: 'Que se passe-t-il en cas de rejet ?',
                a: "L'administrateur laisse un motif de correction. Vous pouvez modifier puis resoumettre.",
              },
            ].map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-emerald-100 dark:border-slate-700 p-6 bg-emerald-50/40 dark:bg-slate-950 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{item.q}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-600/30 rounded-full filter blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-900/50 rounded-full filter blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold mb-6 tracking-tight">Commencez dès maintenant</h2>
          <p className="text-xl text-emerald-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Obtenez votre certificat numérique sécurisé en quelques étapes.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-emerald-800 font-bold text-base hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-900/40 hover:shadow-2xl hover:shadow-emerald-900/50 hover:-translate-y-0.5"
          >
            Créer mon compte
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
            <div className="lg:col-span-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-700/20 border border-emerald-600/30">
                  <Shield className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="font-bold text-white text-lg">PKI Souverain</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Plateforme nationale de certification numérique pour l'émission, la gestion, la révocation
                et le suivi des certificats en environnement admin et utilisateur.
              </p>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Yaoundé, Cameroun</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <a href="mailto:support@pki.gov" className="hover:text-white transition">support@pki.gov</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>+237 6 00 00 00 00</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-semibold text-white mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm">
                {NAV_ITEMS.map(([label, id]) => (
                  <li key={label}>
                    <button onClick={() => scrollTo(id)} className="hover:text-white transition text-left">
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                {['Génération CSR', 'Validation demandes', 'Émission certificats', 'Gestion CRL'].map((s) => (
                  <li key={s} className="text-slate-400">{s}</li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-semibold text-white mb-4">Conformité</h4>
              <ul className="space-y-2 text-sm">
                {['X.509', 'Traçabilité audit', 'Gestion des rôles', 'Politique de sécurité'].map((s) => (
                  <li key={s} className="text-slate-400">{s}</li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-semibold text-white mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/#/login" className="hover:text-white transition inline-flex items-center gap-1">
                    Connexion <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a href="/#/register" className="hover:text-white transition inline-flex items-center gap-1">
                    Créer un compte <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li><a href="mailto:admin@pki.gov" className="hover:text-white transition">Contact admin</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row gap-3 md:gap-0 justify-between items-start md:items-center text-sm">
            <div>© 2026 PKI Souverain. Tous droits réservés.</div>
            <div className="flex gap-6">
              <span className="text-slate-500">Version plateforme : v1.0</span>
              <span className="text-slate-500">État service : Opérationnel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
