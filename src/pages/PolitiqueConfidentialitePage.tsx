import { Link } from 'react-router-dom';
import { Lock, ChevronLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{children}</div>
  </section>
);

export default function PolitiqueConfidentialitePage() {
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/40">
              <Lock size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">ANTIC PKI — Document légal</p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Politique de Confidentialité</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Dernière mise à jour : juillet 2025 — Version 1.0
          </p>
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300">
            L'ANTIC s'engage à protéger la vie privée de ses utilisateurs. Cette politique décrit quelles données nous collectons, pourquoi, et comment vous pouvez exercer vos droits.
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <Section title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des données personnelles collectées via la plateforme ANTICERT PKI est :
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white">Agence Nationale des Technologies de l'Information et de la Communication (ANTIC)</p>
              <p className="mt-1">Avenue Rosa Parks, Yaoundé, Cameroun</p>
              <p>Site web : www.antic.cm — Email : contact@antic.cm</p>
            </div>
          </Section>

          <Section title="2. Données personnelles collectées">
            <p>Dans le cadre de l'émission de certificats électroniques, l'ANTIC collecte les catégories de données suivantes :</p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4 text-left font-semibold text-gray-700 dark:text-gray-300">Catégorie</th>
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Données</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    ['Identification', 'Nom, prénom, date et lieu de naissance, nationalité'],
                    ['Contact', 'Adresse e-mail, numéro de téléphone (si fourni)'],
                    ['Pièce d\'identité', 'Numéro et type de document (CNI, passeport), date d\'expiration, images recto-verso'],
                    ['Biométrie faciale', 'Photo selfie capturée pour comparaison avec la pièce d\'identité'],
                    ['Données de certificat', 'Common Name, Organisation, Unité Organisationnelle, pays, e-mail de certificat'],
                    ['Données de connexion', 'Adresse IP, horodatage des connexions, journaux d\'audit'],
                    ['Données de paiement', 'Référence de transaction SharePay (aucune donnée bancaire stockée directement)'],
                  ].map(([cat, data]) => (
                    <tr key={cat}>
                      <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-200 align-top whitespace-nowrap">{cat}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="3. Finalités du traitement">
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Vérification d'identité (KYC)</strong> — s'assurer que la demande est effectuée par la personne légitime, en comparant la photo selfie au document d'identité fourni.</li>
              <li><strong>Émission du certificat électronique</strong> — inscrire les informations du demandeur dans le certificat signé par l'Autorité de Certification ANTIC.</li>
              <li><strong>Gestion du compte utilisateur</strong> — création, authentification, récupération de mot de passe via OTP.</li>
              <li><strong>Traitement du paiement</strong> — transmission de la référence de paiement à l'opérateur SharePay pour confirmation des frais d'émission.</li>
              <li><strong>Notification</strong> — envoi d'e-mails de confirmation, de récépissés, et de rappels d'expiration de certificat.</li>
              <li><strong>Audit et sécurité</strong> — journalisation des actions sensibles pour détecter les usages frauduleux et assurer la traçabilité réglementaire.</li>
              <li><strong>Obligations légales</strong> — conservation des données requises par la réglementation camerounaise applicable aux autorités de certification.</li>
            </ul>
          </Section>

          <Section title="4. Base légale du traitement">
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Exécution d'une mission de service public</strong> (Loi N° 2010/021 du 21 décembre 2010) — émission de certificats électroniques par une autorité de certification publique.</li>
              <li><strong>Consentement</strong> — pour la comparaison faciale (données biométriques) et l'envoi de communications non essentielles.</li>
              <li><strong>Obligation légale</strong> — conservation des journaux d'audit conformément aux exigences réglementaires.</li>
              <li><strong>Exécution d'un contrat</strong> — traitement des paiements et émission du certificat demandé.</li>
            </ul>
          </Section>

          <Section title="5. Données biométriques et comparaison faciale">
            <p>
              La photo selfie capturée lors de la demande de certificat est une donnée à caractère personnel sensible. Elle est utilisée <strong>exclusivement</strong> pour vérifier que le demandeur est bien la personne figurant sur la pièce d'identité fournie. Cette comparaison est effectuée de manière automatisée par un système d'intelligence artificielle embarqué, puis vérifiée par un agent ANTIC.
            </p>
            <p>
              La photo selfie n'est pas transmise à des tiers à des fins commerciales. Elle est conservée pendant la durée de validité du certificat augmentée d'une période de 3 ans à des fins d'audit, puis supprimée.
            </p>
          </Section>

          <Section title="6. Destinataires des données">
            <p>Vos données peuvent être transmises aux destinataires suivants :</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Agents ANTIC habilités</strong> — administrateurs et agents AEL chargés d'examiner et valider les demandes de certificat.</li>
              <li><strong>SharePay</strong> — opérateur de paiement, uniquement pour la confirmation des transactions (référence de paiement).</li>
              <li><strong>Opérateurs d'envoi d'e-mails et SMS</strong> — pour les notifications transactionnelles (confirmation, récépissé, rappels d'expiration).</li>
              <li><strong>Autorités judiciaires</strong> — en cas de réquisition légale.</li>
            </ul>
            <p>
              Aucune donnée personnelle n'est vendue, louée ou cédée à des tiers à des fins commerciales ou publicitaires.
            </p>
          </Section>

          <Section title="7. Durée de conservation">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4 text-left font-semibold text-gray-700 dark:text-gray-300">Type de données</th>
                    <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    ['Données de compte utilisateur', 'Durée d\'activité du compte + 3 ans après suppression'],
                    ['Données du certificat', 'Durée de validité du certificat + 5 ans (archivage légal)'],
                    ['Photos d\'identité et selfie', 'Durée du certificat + 3 ans, puis suppression définitive'],
                    ['Journaux d\'audit', '5 ans à compter de l\'action enregistrée'],
                    ['Données de paiement', '10 ans (obligation comptable légale)'],
                    ['Récépissés électroniques', '10 ans (document à valeur légale)'],
                  ].map(([type, duree]) => (
                    <tr key={type}>
                      <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-200 align-top">{type}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{duree}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="8. Vos droits">
            <p>Conformément à la réglementation camerounaise applicable, vous disposez des droits suivants concernant vos données personnelles :</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Droit d'accès</strong> — obtenir une copie des données vous concernant détenues par l'ANTIC.</li>
              <li><strong>Droit de rectification</strong> — faire corriger toute donnée inexacte ou incomplète.</li>
              <li><strong>Droit à l'effacement</strong> — demander la suppression de vos données (sous réserve des obligations légales de conservation).</li>
              <li><strong>Droit d'opposition</strong> — vous opposer au traitement de vos données pour des raisons légitimes.</li>
              <li><strong>Droit à la limitation</strong> — demander la suspension du traitement dans certains cas.</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré et lisible par machine.</li>
            </ul>
            <p>
              Pour exercer ces droits, adressez une demande écrite à <strong>contact@antic.cm</strong>, en précisant votre identité et la nature de votre demande. Nous nous engageons à répondre dans un délai de 30 jours calendaires.
            </p>
          </Section>

          <Section title="9. Sécurité des données">
            <p>
              L'ANTIC met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, divulgation, modification ou destruction :
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Chiffrement des communications via TLS 1.2+ (HTTPS).</li>
              <li>Stockage des mots de passe sous forme de hachage bcrypt — ils ne sont jamais stockés en clair.</li>
              <li>Authentification à deux facteurs (OTP par e-mail) lors de la création de compte.</li>
              <li>Contrôle d'accès basé sur les rôles (utilisateur, administrateur, super-administrateur).</li>
              <li>Journalisation de toutes les actions sensibles avec horodatage.</li>
              <li>Certificats électroniques signés cryptographiquement avec l'infrastructure PKI ANTIC.</li>
            </ul>
          </Section>

          <Section title="10. Cookies et traceurs">
            <p>
              La Plateforme utilise uniquement des cookies strictement nécessaires au fonctionnement du service (maintien de session, jeton d'authentification JWT stocké localement). Aucun cookie publicitaire ou de suivi comportemental tiers n'est déposé.
            </p>
          </Section>

          <Section title="11. Modifications de la politique">
            <p>
              L'ANTIC se réserve le droit de modifier la présente politique à tout moment. Toute modification substantielle sera notifiée par e-mail aux utilisateurs actifs. La date de dernière mise à jour est indiquée en haut du document.
            </p>
          </Section>

          <Section title="12. Contact et réclamations">
            <p>
              Pour toute question relative à cette politique ou pour exercer vos droits, contactez-nous à :
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white">ANTIC — Délégué à la Protection des Données</p>
              <p className="mt-1">Avenue Rosa Parks, Yaoundé, Cameroun</p>
              <p>Email : contact@antic.cm</p>
            </div>
          </Section>

        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
          © {new Date().getFullYear()} ANTIC — Agence Nationale des Technologies de l'Information et de la Communication
        </p>
      </div>
    </div>
  );
}
