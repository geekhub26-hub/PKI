import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{children}</div>
  </section>
);

export default function ConditionsGeneralesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeft size={16} /> Retour à l'accueil
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <ShieldCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">ANTIC PKI — Document légal</p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conditions Générales d'Utilisation</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Dernière mise à jour : juillet 2025 — Version 1.0
          </p>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
            En utilisant la plateforme ANTIC PKI, vous acceptez sans réserve les présentes conditions. Veuillez les lire attentivement avant tout usage.
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <Section title="1. Objet">
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme ANTICERT PKI (ci-après « la Plateforme »), éditée par l'<strong>Agence Nationale des Technologies de l'Information et de la Communication (ANTIC)</strong>, établissement public administratif camerounais créé par le Décret N° 2002/092 du 8 avril 2002.
            </p>
            <p>
              La Plateforme permet aux personnes physiques et morales de soumettre des demandes de certificats électroniques, de gérer leurs demandes en cours, de télécharger leurs certificats numériques et récépissés, et d'effectuer les paiements associés aux frais d'émission.
            </p>
          </Section>

          <Section title="2. Définitions">
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Certificat électronique :</strong> fichier numérique signé par l'ANTIC attestant de l'identité de son titulaire et permettant des opérations cryptographiques (signature, chiffrement).</li>
              <li><strong>Utilisateur :</strong> toute personne physique ou morale qui crée un compte sur la Plateforme et soumet ou gère une demande de certificat.</li>
              <li><strong>Administrateur :</strong> agent habilité de l'ANTIC chargé de valider les demandes, signer les CSR et émettre les certificats.</li>
              <li><strong>CSR (Certificate Signing Request) :</strong> fichier généré par le demandeur contenant sa clé publique et ses informations d'identité, soumis à l'ANTIC pour signature.</li>
              <li><strong>Récépissé :</strong> document électronique signé émis par l'ANTIC attestant la réception et le traitement d'une demande de certificat.</li>
              <li><strong>KYC (Know Your Customer) :</strong> processus de vérification d'identité réalisé à partir des pièces justificatives fournies par l'Utilisateur.</li>
            </ul>
          </Section>

          <Section title="3. Accès à la Plateforme">
            <p>
              L'accès à la Plateforme est ouvert à toute personne physique majeure (18 ans et plus) ou personne morale légalement constituée au Cameroun ou souhaitant obtenir un certificat électronique camerounais.
            </p>
            <p>
              L'utilisation de la Plateforme nécessite la création d'un compte personnel protégé par un identifiant (adresse e-mail) et un mot de passe. L'Utilisateur est seul responsable de la confidentialité de ses identifiants. Tout accès effectué depuis son compte est présumé effectué par l'Utilisateur lui-même.
            </p>
            <p>
              L'Utilisateur s'engage à vérifier son adresse e-mail via le code OTP envoyé lors de l'inscription avant de pouvoir accéder aux fonctionnalités de la Plateforme.
            </p>
          </Section>

          <Section title="4. Obligations de l'Utilisateur">
            <p>En utilisant la Plateforme, l'Utilisateur s'engage à :</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Fournir des informations exactes, complètes et à jour lors de son inscription et lors de toute demande de certificat ;</li>
              <li>Soumettre des pièces d'identité authentiques et en cours de validité (CNI recto-verso ou passeport) ;</li>
              <li>Ne pas usurper l'identité d'autrui, ni tenter d'obtenir un certificat au nom d'une tiène personne sans autorisation expresse ;</li>
              <li>Protéger sa clé privée et ne pas la partager ; toute compromission doit être signalée immédiatement à l'ANTIC pour révocation du certificat ;</li>
              <li>Utiliser le certificat électronique uniquement à des fins légales, conformément à la législation camerounaise en vigueur ;</li>
              <li>Ne pas tenter de contourner les mécanismes de sécurité de la Plateforme ;</li>
              <li>Signaler sans délai toute anomalie, faille ou utilisation frauduleuse constatée.</li>
            </ul>
          </Section>

          <Section title="5. Processus de délivrance du certificat">
            <p>La délivrance d'un certificat électronique suit les étapes suivantes :</p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li><strong>Soumission de la demande</strong> — l'Utilisateur remplit le formulaire, fournit ses pièces d'identité et un selfie pour comparaison faciale.</li>
              <li><strong>Examen préliminaire</strong> — un administrateur ANTIC vérifie la recevabilité du dossier (PENDING_REVIEW → REVIEW_APPROVED ou REJECTED).</li>
              <li><strong>Paiement des frais</strong> — l'Utilisateur règle les frais d'émission via la plateforme SharePay (AWAITING_PAYMENT → PAYMENT_CONFIRMED).</li>
              <li><strong>Soumission du CSR</strong> — l'Utilisateur fournit son Certificate Signing Request généré depuis son poste.</li>
              <li><strong>Signature par l'ANTIC</strong> — l'administrateur signe le CSR avec la clé de l'Autorité de Certification ANTIC (ISSUED).</li>
              <li><strong>Téléchargement</strong> — l'Utilisateur télécharge son certificat au format P12 ou PEM.</li>
            </ol>
            <p>L'ANTIC se réserve le droit de rejeter toute demande dont le dossier est incomplet, frauduleux ou ne respectant pas les politiques de certification en vigueur.</p>
          </Section>

          <Section title="6. Paiements">
            <p>
              Les frais d'émission de certificat sont fixés par arrêté et publiés sur la Plateforme. Ils sont payables en ligne via le service de paiement intégré (SharePay). Aucun certificat n'est émis avant confirmation effective du paiement.
            </p>
            <p>
              Les paiements sont non remboursables sauf décision de rejet de la demande imputable à une erreur de l'ANTIC. En cas de rejet pour dossier incomplet ou frauduleux, aucun remboursement n'est effectué.
            </p>
          </Section>

          <Section title="7. Durée de validité du certificat">
            <p>
              Les certificats électroniques émis par l'ANTICERT ont une durée de validité de <strong>deux (2) ans</strong> à compter de la date d'émission. À l'expiration, le titulaire doit soumettre une nouvelle demande. Des rappels automatiques sont envoyés à J-15, J-7 et J-1 avant expiration.
            </p>
          </Section>

          <Section title="8. Révocation">
            <p>
              L'Utilisateur peut demander la révocation de son certificat à tout moment depuis la Plateforme, notamment en cas de compromission de sa clé privée, de perte, ou de changement d'identité. L'ANTIC peut également révoquer un certificat d'office en cas de violation des présentes CGU ou d'injonction judiciaire. Les certificats révoqués sont publiés dans la Liste de Révocation de Certificats (CRL) maintenue par l'ANTIC.
            </p>
          </Section>

          <Section title="9. Responsabilité">
            <p>
              L'ANTIC met en œuvre tous les moyens raisonnables pour assurer la disponibilité et la sécurité de la Plateforme, mais ne saurait être tenu responsable des interruptions de service dues à des causes indépendantes de sa volonté (force majeure, défaillance d'opérateurs tiers, cyberattaques).
            </p>
            <p>
              L'Utilisateur est seul responsable de la conservation de sa clé privée et de tout usage fait de son certificat. En cas d'utilisation frauduleuse résultant d'une négligence de l'Utilisateur (partage de mot de passe, perte de clé privée non signalée), l'ANTIC ne saurait être tenu responsable.
            </p>
          </Section>

          <Section title="10. Propriété intellectuelle">
            <p>
              L'ensemble des éléments constituant la Plateforme (logiciel, design, contenus, marques, logos) est la propriété exclusive de l'ANTIC et est protégé par les dispositions du droit camerounais de la propriété intellectuelle. Toute reproduction, adaptation ou exploitation sans autorisation expresse est interdite.
            </p>
          </Section>

          <Section title="11. Suspension et résiliation du compte">
            <p>
              L'ANTIC se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU, de tentative de fraude, ou d'usage abusif de la Plateforme. L'Utilisateur peut également demander la suppression de son compte ; ses données seront alors anonymisées conformément à la Politique de Confidentialité, à l'exception des données conservées pour des raisons légales ou d'audit.
            </p>
          </Section>

          <Section title="12. Modifications des CGU">
            <p>
              L'ANTIC se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs sont informés de toute modification significative par e-mail ou notification sur la Plateforme. La poursuite de l'utilisation de la Plateforme après notification vaut acceptation des nouvelles conditions.
            </p>
          </Section>

          <Section title="13. Droit applicable et juridiction compétente">
            <p>
              Les présentes CGU sont régies par le droit de la République du Cameroun, notamment la Loi N° 2010/012 du 21 décembre 2010 relative à la cybersécurité et la cybercriminalité, et la Loi N° 2010/021 du 21 décembre 2010 régissant le commerce électronique au Cameroun.
            </p>
            <p>
              Tout litige relatif à l'interprétation ou à l'exécution des présentes CGU sera soumis aux tribunaux compétents de Yaoundé, Cameroun.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>Pour toute question relative aux présentes CGU, vous pouvez contacter l'ANTIC à :</p>
            <ul className="list-none space-y-1 pl-0">
              <li><strong>Adresse :</strong> Avenue Rosa Parks, Yaoundé, Cameroun</li>
              <li><strong>Site web :</strong> www.antic.cm</li>
              <li><strong>Email :</strong> contact@antic.cm</li>
            </ul>
          </Section>

        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
          © {new Date().getFullYear()} ANTIC — Agence Nationale des Technologies de l'Information et de la Communication
        </p>
      </div>
    </div>
  );
}
