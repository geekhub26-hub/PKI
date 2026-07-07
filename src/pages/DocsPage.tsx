import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  BookOpen, User, Shield, FileText, Award, CheckSquare, XCircle,
  Download, BarChart3, Key, RefreshCw, Users, ClipboardList,
  ChevronRight, AlertTriangle, Info, CheckCircle2, Lock,
  ArrowRight, Search, LogIn, UserPlus, LayoutGrid,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────── */
type Tab = 'user' | 'admin';

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

/* ── Section definitions ────────────────────────────────── */
const USER_SECTIONS: Section[] = [
  { id: 'u-intro',        label: 'Introduction',             icon: BookOpen      },
  { id: 'u-auth',         label: 'Connexion & Inscription',  icon: LogIn         },
  { id: 'u-dashboard',    label: 'Tableau de bord',          icon: LayoutGrid    },
  { id: 'u-csr',          label: 'Demande de certificat',    icon: FileText      },
  { id: 'u-suivi',        label: 'Suivi des demandes',       icon: CheckSquare   },
  { id: 'u-certs',        label: 'Mes certificats',          icon: Award         },
  { id: 'u-revoke',       label: 'Révoquer un certificat',   icon: XCircle       },
  { id: 'u-crl',          label: 'Télécharger la CRL',       icon: Download      },
  { id: 'u-recepisses',   label: 'Récépissés',               icon: ClipboardList },
  { id: 'u-profile',      label: 'Mon profil',               icon: User          },
];

const ADMIN_SECTIONS: Section[] = [
  { id: 'a-intro',        label: 'Vue d\'ensemble',          icon: BookOpen      },
  { id: 'a-dashboard',    label: 'Dashboard & Stats',        icon: BarChart3     },
  { id: 'a-requests',     label: 'Gérer les demandes',       icon: ClipboardList },
  { id: 'a-ca',           label: 'Autorité de Certification',icon: Key           },
  { id: 'a-sign',         label: 'Signer des CSR',           icon: Award         },
  { id: 'a-crl',          label: 'CRL & Révocation',         icon: RefreshCw     },
  { id: 'a-audit',        label: 'Journal d\'audit',         icon: Shield        },
  { id: 'a-users',        label: 'Gestion des utilisateurs', icon: Users         },
];

/* ── Small helper components ───────────────────────────── */
function Note({ type, children }: { type: 'info' | 'warn' | 'ok'; children: React.ReactNode }) {
  const cfg = {
    info: { cls: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300', Icon: Info },
    warn: { cls: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300', Icon: AlertTriangle },
    ok:   { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300', Icon: CheckCircle2 },
  }[type];
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${cfg.cls}`}>
      <cfg.Icon size={16} className="mt-0.5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          {n}
        </div>
        {children && <div className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-700" />}
      </div>
      <div className="pb-6 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-white">{title}</p>
        {children && <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-2">{children}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ label, cls }: { label: string; cls: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

function SectionTitle({ id, icon: Icon, title, subtitle }: { id: string; icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div id={id} className="scroll-mt-6 mb-6 flex items-start gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
        <Icon size={20} className="text-emerald-700 dark:text-emerald-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ── User documentation ─────────────────────────────────── */
function UserDocs() {
  return (
    <div className="space-y-14">

      {/* Intro */}
      <section>
        <SectionTitle id="u-intro" icon={BookOpen} title="Introduction" subtitle="Bienvenue sur PKI Souverain" />
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p>
            <strong className="text-slate-800 dark:text-white">PKI Souverain</strong> est la plateforme nationale de gestion des certificats numériques
            développée par l'<strong className="text-slate-800 dark:text-white">ANTIC Cameroun</strong>.
            Elle vous permet de demander, recevoir et gérer des certificats X.509 signés par l'Autorité de Certification souveraine.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Lock,     title: 'Sécurisé',    desc: 'Clés RSA 4096 bits, stockage chiffré' },
              { icon: FileText, title: 'Simple',       desc: 'Interface guidée étape par étape' },
              { icon: Award,    title: 'Officiel',     desc: 'AC racine reconnue par l\'État camerounais' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40 p-4">
                <Icon size={18} className="mb-2 text-emerald-600 dark:text-emerald-400" />
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth */}
      <section>
        <SectionTitle id="u-auth" icon={LogIn} title="Connexion & Inscription" subtitle="Créer un compte et se connecter" />
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="mb-3 font-semibold text-slate-800 dark:text-white flex items-center gap-2"><UserPlus size={16} /> Créer un compte</h3>
            <div className="space-y-0">
              <Step n={1} title="Accédez à la page d'inscription"><p>Cliquez sur <strong>S'inscrire</strong> depuis la page de connexion.</p></Step>
              <Step n={2} title="Renseignez vos informations"><p>Entrez votre <strong>prénom</strong>, <strong>nom</strong>, <strong>adresse email</strong> et un <strong>mot de passe</strong> (minimum 8 caractères).</p></Step>
              <Step n={3} title="Vérifiez votre email"><p>Un code OTP à 6 chiffres est envoyé à votre adresse. Entrez-le dans la page de vérification. Le code expire après 10 minutes.</p></Step>
              <Step n={4} title="Connexion autorisée" />
            </div>
            <Note type="info">L'email doit être valide — il servira à recevoir vos notifications et codes de vérification.</Note>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-slate-800 dark:text-white flex items-center gap-2"><Lock size={16} /> Se connecter</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">Entrez votre email et mot de passe. Pour les comptes administrateur, une vérification à deux facteurs (code email) est requise.</p>
            <Note type="warn">En cas d'oubli de mot de passe, utilisez <strong>Mot de passe oublié</strong> depuis la page de connexion.</Note>
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section>
        <SectionTitle id="u-dashboard" icon={LayoutGrid} title="Tableau de bord" subtitle="Vue d'ensemble de votre activité" />
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Le tableau de bord affiche un résumé de votre situation : nombre de certificats actifs, demandes en cours, et dernières activités.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: 'Certificats actifs',  desc: 'Certificats valides en votre possession' },
            { label: 'Demandes en cours',   desc: 'Dossiers soumis et en attente de traitement' },
            { label: 'Certificats expirés', desc: 'Certificats dont la validité est dépassée' },
            { label: 'Demandes rejetées',   desc: 'Dossiers refusés par un administrateur' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-700/60 p-3 text-sm">
              <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
              <div><p className="font-medium text-slate-800 dark:text-white">{label}</p><p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* CSR */}
      <section>
        <SectionTitle id="u-csr" icon={FileText} title="Demande de certificat (CSR)" subtitle="Soumettre une nouvelle demande" />
        <div className="space-y-6 text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Pour obtenir un certificat numérique, vous devez soumettre un dossier complet via la page <strong>Nouvelle demande</strong>.
          </p>
          <div>
            <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Informations requises</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/60">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Champ</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Description</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Obligatoire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {[
                    ['Common Name (CN)',       'Nom complet ou nom de domaine',              'Oui'],
                    ['Organisation (O)',        'Nom de l\'organisation',                     'Oui'],
                    ['Unité (OU)',              'Département ou service',                     'Non'],
                    ['Pays (C)',                'Code pays ISO (ex : CM)',                    'Oui'],
                    ['Ville / Province',        'Localisation géographique',                  'Non'],
                    ['Pièce d\'identité',       'Scan CNI, Passeport ou Permis de séjour',   'Oui'],
                    ['Photo de profil',         'Portrait récent (validation IA)',            'Oui'],
                  ].map(([f, d, r]) => (
                    <tr key={f}>
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-white whitespace-nowrap">{f}</td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{d}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r === 'Oui' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>{r}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Note type="info">Vos pièces d'identité sont validées automatiquement par un système d'IA avant traitement par un administrateur.</Note>
        </div>
      </section>

      {/* Suivi */}
      <section>
        <SectionTitle id="u-suivi" icon={CheckSquare} title="Suivi des demandes" subtitle="Comprendre les statuts de vos dossiers" />
        <div className="space-y-4 text-sm">
          <p className="text-slate-600 dark:text-slate-400">Chaque demande passe par plusieurs étapes. Voici la signification de chaque statut :</p>
          <div className="space-y-2">
            {[
              { s: 'En attente',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',      desc: 'Votre dossier a été soumis et attend un examen par un administrateur.' },
              { s: 'En révision',    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',          desc: 'Un administrateur examine actuellement votre dossier.' },
              { s: 'Approuvée',      cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',  desc: 'Votre demande est approuvée. Vous pouvez soumettre votre CSR.' },
              { s: 'CSR soumis',     cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',  desc: 'Votre CSR a été soumis et est en attente de signature.' },
              { s: 'Correction req.',cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',          desc: 'L\'administrateur demande une correction. Vérifiez les commentaires.' },
              { s: 'Émis',           cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', desc: 'Votre certificat a été signé et est disponible dans Mes certificats.' },
              { s: 'Rejeté',         cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',              desc: 'Votre demande a été refusée. Consultez la raison dans les détails.' },
            ].map(({ s, cls, desc }) => (
              <div key={s} className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-700/60 p-3">
                <StatusBadge label={s} cls={cls} />
                <p className="text-xs text-slate-600 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
          <Note type="warn">Si votre statut est <strong>Correction requise</strong>, corrigez votre dossier dans les plus brefs délais pour éviter une annulation.</Note>
        </div>
      </section>

      {/* Certs */}
      <section>
        <SectionTitle id="u-certs" icon={Award} title="Mes certificats" subtitle="Consulter et télécharger vos certificats" />
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p>La page <strong>Mes certificats</strong> liste l'ensemble de vos certificats émis. Pour chaque certificat, vous pouvez :</p>
          <ul className="space-y-2">
            {[
              'Voir les détails (émetteur, validité, usage)',
              'Télécharger au format PEM ou DER',
              'Télécharger le fichier P12 (PKCS#12) protégé par mot de passe',
              'Vérifier le statut (Actif, Révoqué, Expiré)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
          <Note type="ok">Le fichier P12 est envoyé à votre email avec son mot de passe pour une sécurité maximale.</Note>
        </div>
      </section>

      {/* Revoke */}
      <section>
        <SectionTitle id="u-revoke" icon={XCircle} title="Révoquer un certificat" subtitle="Signaler une compromission ou ne plus utiliser un certificat" />
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p>Si votre clé privée est compromise ou si vous n'avez plus besoin d'un certificat, vous pouvez le révoquer.</p>
          <Step n={1} title="Accédez à Révoquer certificat" />
          <Step n={2} title="Entrez l'ID ou le numéro de série du certificat" />
          <Step n={3} title="Sélectionnez la raison de révocation"><p>Raisons disponibles : Compromission de clé, Cessation d'activité, Remplacement, Affiliation modifiée.</p></Step>
          <Step n={4} title="Confirmez la révocation" />
          <Note type="warn"><strong>La révocation est irréversible.</strong> Le certificat sera ajouté à la Liste de Révocation (CRL) et ne pourra plus être utilisé.</Note>
        </div>
      </section>

      {/* CRL */}
      <section>
        <SectionTitle id="u-crl" icon={Download} title="Télécharger la CRL" subtitle="Liste de Révocation des Certificats" />
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <p>La <strong>CRL (Certificate Revocation List)</strong> est un fichier publié par l'AC qui liste tous les certificats révoqués. Téléchargez-la pour vérifier la validité d'un certificat.</p>
          <p>Le fichier est au format standard <strong>DER (.crl)</strong>, compatible avec tous les outils PKI (OpenSSL, Java KeyStore, Windows...).</p>
          <Note type="info">La CRL est régulièrement mise à jour par les administrateurs. Téléchargez toujours la version la plus récente.</Note>
        </div>
      </section>

      {/* Récépissés */}
      <section>
        <SectionTitle id="u-recepisses" icon={ClipboardList} title="Récépissés" subtitle="Documents officiels de vos demandes" />
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <p>Un <strong>récépissé</strong> est un document officiel généré automatiquement lors de la soumission d'une demande. Il atteste que votre dossier a bien été reçu par le système PKI Souverain.</p>
          <p>Chaque récépissé contient : numéro de référence unique, date de soumission, données du demandeur, et un code de vérification.</p>
          <Note type="ok">Conservez votre récépissé — il peut être demandé en cas de litige ou de demande administrative.</Note>
        </div>
      </section>

      {/* Profile */}
      <section>
        <SectionTitle id="u-profile" icon={User} title="Mon profil" subtitle="Gérer vos informations personnelles" />
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p>Depuis votre profil, vous pouvez :</p>
          <ul className="space-y-2">
            {[
              'Modifier votre prénom et nom',
              'Choisir un avatar illustré ou importer une photo de profil',
              'Changer votre mot de passe (avec indicateur de force)',
              'Consulter vos informations de compte (date d\'inscription, dernière connexion)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <ArrowRight size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
          <Note type="info">L'adresse email ne peut pas être modifiée. Contactez un administrateur si nécessaire.</Note>
        </div>
      </section>

    </div>
  );
}

/* ── Admin documentation ────────────────────────────────── */
function AdminDocs() {
  return (
    <div className="space-y-14">

      {/* Intro */}
      <section>
        <SectionTitle id="a-intro" icon={BookOpen} title="Vue d'ensemble" subtitle="Rôles et responsabilités administratives" />
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p>La plateforme PKI Souverain définit plusieurs rôles administratifs avec des niveaux de privilèges différents :</p>
          <div className="space-y-2">
            {[
              { role: 'SUPER_ADMIN',  color: '#7C3AED', label: 'Super Admin',    desc: 'Accès total : paramètres système, gestion complète. Un seul compte par instance.' },
              { role: 'ADMIN',        color: '#DC2626', label: 'Administrateur', desc: 'Gère les demandes, signe les CSR, révoque des certificats, consulte l\'audit.' },
              { role: 'AE_CENTRALE',  color: '#D97706', label: 'AE Centrale',    desc: 'Autorité d\'Enregistrement centrale : valide les dossiers avant signature.' },
              { role: 'ADMIN_AEL',    color: '#B45309', label: 'Admin AEL',      desc: 'Gère une Autorité d\'Enregistrement Locale.' },
              { role: 'AEL',          color: '#047857', label: 'AEL',            desc: 'Autorité d\'Enregistrement Locale : traite les demandes de sa zone.' },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-700/60 p-3">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white flex-shrink-0"
                  style={{ background: color }}>{label}</span>
                <p className="text-xs text-slate-600 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section>
        <SectionTitle id="a-dashboard" icon={BarChart3} title="Dashboard & Statistiques" subtitle="Monitoring de l'activité PKI" />
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <div>
            <h3 className="mb-2 font-semibold text-slate-800 dark:text-white">Dashboard opérationnel</h3>
            <p>Affiche les indicateurs en temps réel : demandes en attente, certificats actifs, taux de révocation, état de l'AC.</p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-slate-800 dark:text-white">Page Statistiques</h3>
            <p className="mb-2">Visualisations analytiques avec données historiques sur 6 mois :</p>
            <ul className="space-y-1">
              {[
                'Courbe des certificats émis vs demandes (AreaChart)',
                'Activité d\'audit par mois (LineChart)',
                'Demandes vs émissions combinées (ComposedChart)',
                'Santé système normalisée (RadarChart)',
                'Répartition par statut (PieChart donut)',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Requests */}
      <section>
        <SectionTitle id="a-requests" icon={ClipboardList} title="Gérer les demandes" subtitle="Traitement des dossiers de certification" />
        <div className="space-y-6 text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            La page <strong>Gérer demandes</strong> est un DataTable complet avec recherche, tri, filtre par statut, filtre par date et pagination.
          </p>
          <div>
            <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Actions disponibles sur un dossier</h3>
            <div className="space-y-3">
              {[
                { action: 'Approuver',          desc: 'Valide le dossier — l\'utilisateur peut soumettre son CSR.' },
                { action: 'Demander correction', desc: 'Renvoie le dossier à l\'utilisateur avec un commentaire.' },
                { action: 'Rejeter',             desc: 'Clôture définitivement la demande avec un motif.' },
                { action: 'Signer le CSR',       desc: 'Une fois le CSR soumis, émet le certificat final.' },
              ].map(({ action, desc }) => (
                <div key={action} className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-900/30">
                    <ChevronRight size={12} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Note type="warn">Toutes les actions sur les demandes sont enregistrées dans le journal d'audit avec l'identifiant de l'administrateur.</Note>
        </div>
      </section>

      {/* CA */}
      <section>
        <SectionTitle id="a-ca" icon={Key} title="Autorité de Certification" subtitle="Initialiser et gérer la CA racine" />
        <div className="space-y-6 text-sm text-slate-600 dark:text-slate-400">
          <Note type="warn"><strong>Action critique.</strong> La génération d'une AC ne doit être effectuée qu'une seule fois lors de l'initialisation du système. Elle ne peut pas être annulée.</Note>
          <div>
            <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Paramètres de l'AC</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/60">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Paramètre</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Valeur par défaut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {[
                    ['Algorithme',      'RSA 4096 bits'],
                    ['Validité',        '10 ans'],
                    ['Hachage',         'SHA-256'],
                    ['Format',          'X.509 v3'],
                    ['Stockage clé',    'PKCS#12 chiffré (AES-256)'],
                  ].map(([p, v]) => (
                    <tr key={p}>
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-white">{p}</td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Sign CSR */}
      <section>
        <SectionTitle id="a-sign" icon={Award} title="Signer des CSR" subtitle="Émettre un certificat depuis un CSR" />
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p>Après approbation d'une demande et soumission du CSR par l'utilisateur, l'administrateur peut signer le CSR pour émettre le certificat.</p>
          <Step n={1} title="Ouvrez la demande concernée"><p>Dans la liste des demandes, filtrez sur statut <strong>CSR soumis</strong>.</p></Step>
          <Step n={2} title="Vérifiez les informations du CSR"><p>Contrôlez le Common Name, l'organisation et les extensions demandées.</p></Step>
          <Step n={3} title="Signez le CSR"><p>Cliquez sur <strong>Émettre le certificat</strong>. La clé de l'AC signe le CSR et génère un certificat X.509.</p></Step>
          <Step n={4} title="Notification automatique"><p>L'utilisateur reçoit une notification et peut télécharger son certificat depuis la page <em>Mes certificats</em>.</p></Step>
          <Note type="ok">Le certificat émis a une validité de 2 ans par défaut. Un fichier P12 est généré et envoyé à l'utilisateur par email.</Note>
        </div>
      </section>

      {/* CRL */}
      <section>
        <SectionTitle id="a-crl" icon={RefreshCw} title="CRL & Révocation" subtitle="Gérer la liste de révocation" />
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <div>
            <h3 className="mb-2 font-semibold text-slate-800 dark:text-white">Révoquer un certificat</h3>
            <p>Accédez à <strong>Révoquer cert.</strong>, entrez l'ID ou le numéro de série, sélectionnez la raison RFC 5280 et confirmez. Le certificat est immédiatement marqué révoqué.</p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-slate-800 dark:text-white">Générer / Rotation de la CRL</h3>
            <p className="mb-2">La page <strong>CRL / Rotation</strong> permet de :</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Générer une nouvelle CRL (après révocation)</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Effectuer une rotation de la clé AC (re-signe tous les certs actifs)</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Télécharger la CRL au format DER</li>
            </ul>
          </div>
          <Note type="warn">Publiez une nouvelle CRL après chaque révocation pour que les vérificateurs disposent d'une liste à jour.</Note>
        </div>
      </section>

      {/* Audit */}
      <section>
        <SectionTitle id="a-audit" icon={Shield} title="Journal d'audit" subtitle="Traçabilité complète des actions" />
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p>
            Le journal d'audit enregistre automatiquement toutes les actions sensibles du système avec horodatage,
            identifiant de l'auteur, entité cible et détails JSON.
          </p>
          <div>
            <h3 className="mb-2 font-semibold text-slate-800 dark:text-white">Fonctionnalités du DataTable</h3>
            <ul className="space-y-1">
              {[
                'Recherche plein texte (action, email, entité)',
                'Filtre par type d\'action',
                'Filtre par plage de dates (De / À)',
                'Tri par colonne (action, utilisateur, entité, date)',
                'Pagination numérotée',
                'Suppression individuelle d\'entrées (irréversible)',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Note type="warn">La suppression d'un log d'audit est elle-même enregistrée dans l'audit. Évitez de supprimer des entrées sauf si nécessaire.</Note>
        </div>
      </section>

      {/* Users */}
      <section>
        <SectionTitle id="a-users" icon={Users} title="Gestion des utilisateurs" subtitle="Administrer les comptes de la plateforme" />
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p>La page <strong>Gérer utilisateurs</strong> (Super Admin uniquement) liste tous les comptes avec leurs rôles, statuts et dates.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { action: 'Désactiver un compte',    desc: 'Empêche la connexion sans supprimer les données.' },
              { action: 'Changer le rôle',         desc: 'Promouvoir un utilisateur en ADMIN ou AE.' },
              { action: 'Supprimer un compte',     desc: 'Supprime l\'utilisateur et tous ses certificats.' },
              { action: 'Forcer la vérification',  desc: 'Marquer l\'email comme vérifié manuellement.' },
            ].map(({ action, desc }) => (
              <div key={action} className="rounded-xl border border-slate-100 dark:border-slate-700/60 p-3">
                <p className="font-semibold text-slate-800 dark:text-white text-xs">{action}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
          <Note type="warn">La suppression d'un utilisateur entraîne la suppression en cascade de ses demandes et certificats. Cette opération est irréversible.</Note>
        </div>
      </section>

    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function DocsPage() {
  const { user } = useAuthStore();
  const [tab, setTab]           = useState<Tab>(() => {
    const adminRoles = ['ADMIN','SUPER_ADMIN','AE_CENTRALE','ADMIN_AEL','AEL'];
    return adminRoles.includes(user?.role ?? '') ? 'admin' : 'user';
  });
  const [active, setActive]     = useState('');
  const [search, setSearch]     = useState('');
  const contentRef              = useRef<HTMLDivElement>(null);

  const sections = tab === 'user' ? USER_SECTIONS : ADMIN_SECTIONS;

  // Track active section on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [tab]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filtered = search.trim()
    ? sections.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
    : sections;

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">

      {/* Header */}
      <div className="page-header-bar">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">PKI Souverain</p>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <BookOpen size={22} /> Documentation
            </h1>
            <p className="mt-0.5 text-sm text-white/60">Guide complet d'utilisation de la plateforme</p>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
            <button
              onClick={() => { setTab('user');  setActive(''); }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === 'user'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-white/80 hover:text-white'}`}
            >
              <User size={15} /> Utilisateurs
            </button>
            <button
              onClick={() => { setTab('admin'); setActive(''); }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === 'admin'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-white/80 hover:text-white'}`}
            >
              <Shield size={15} /> Administrateurs
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">

        {/* ── Side navigation ───────────────────────────────── */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="pki-card sticky top-6 p-3">
            {/* Search sections */}
            <div className="relative mb-3">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent pl-7 pr-3 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <nav className="space-y-0.5">
              {filtered.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition ${
                    active === id
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Icon size={13} className="flex-shrink-0" />
                  <span className="truncate">{label}</span>
                  {active === id && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-2 py-3 text-center text-xs text-slate-400">Aucune section trouvée</p>
              )}
            </nav>
          </div>
        </aside>

        {/* ── Content ───────────────────────────────────────── */}
        <div ref={contentRef} className="min-w-0 flex-1 pki-card p-6 lg:p-8">
          {/* Mobile tabs */}
          <div className="mb-6 flex gap-2 lg:hidden">
            {['user','admin'].map((t) => (
              <button key={t} onClick={() => setTab(t as Tab)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  tab === t ? 'bg-emerald-600 text-white' : 'border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                {t === 'user' ? 'Utilisateurs' : 'Administrateurs'}
              </button>
            ))}
          </div>

          {/* Mobile section nav */}
          <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
            {sections.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="rounded-full border border-slate-200 dark:border-slate-600 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 transition">
                {label}
              </button>
            ))}
          </div>

          {tab === 'user'  ? <UserDocs />  : <AdminDocs />}
        </div>
      </div>
    </div>
  );
}
