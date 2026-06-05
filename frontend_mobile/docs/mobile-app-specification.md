# PKI SOUVERAIN - Guide Utilisateur Mobile

## 1. A quoi sert l'application
L'application mobile PKI SOUVERAIN permet a un utilisateur de:
- creer un compte,
- se connecter,
- envoyer sa demande de certificat,
- suivre l'avancement de sa demande,
- soumettre ou generer son CSR apres validation,
- valider son jeton,
- telecharger son certificat,
- recevoir des notifications.

## 2. A qui s'adresse l'application
Cette application est faite pour le role **Utilisateur**.
La partie **Administrateur** est geree sur le web.

## 3. Parcours utilisateur complet
1. Inscription ou connexion.
2. Remplissage du formulaire de demande (identite + informations certificat).
3. Ajout des pieces justificatives.
4. Soumission pour verification.
5. Attente de validation par l'administrateur.
6. Passage en phase 3 (CSR) apres approbation.
7. Validation du jeton si demande.
8. Recupération et telechargement du certificat.

## 4. Ecrans de l'application
### Landing
- presentation du service,
- boutons rapides vers connexion, inscription, documentation.

### Connexion
- email + mot de passe,
- connexion au compte utilisateur.

### Inscription
- prenom, nom, email, mot de passe,
- creation de compte utilisateur.

### Tableau de bord
- synthese des demandes,
- statut des phases,
- nombre de certificats.

### Nouvelle demande (Phase 1 + 2)
- informations personnelles,
- informations certificat (CN, O, etc.),
- ajout des pieces,
- envoi pour verification.

### Phase 3 CSR
- soumettre un CSR deja cree,
- ou generer le CSR depuis l'application,
- finaliser la demande apres validation admin.

### Mes demandes
- liste de toutes les demandes,
- statut de chaque demande,
- date de soumission.

### Mes certificats
- liste des certificats emis,
- telechargement en `.crt`, `.pem`, `.p12`.

### Validation token
- saisie `requestId` + `token`,
- confirmation de validation.

### Notifications
- suivi des changements de statut,
- lecture lu / non-lu,
- marquer tout comme lu.

## 5. Formats de fichiers supportes
### Documents d'identite / justificatifs
- `.jpg`, `.jpeg`, `.png`, `.pdf`

### CSR
- `.csr`, `.pem`

### Certificat telechargeable
- `.crt`, `.pem`, `.p12`

## 6. Regles importantes pour l'utilisateur
- La phase CSR n'est possible qu'apres validation admin.
- Si votre demande est en attente, patientez jusqu'au changement de statut.
- Pour le format `.p12`, un mot de passe est demande au telechargement.
- Verifiez que vos informations d'identite sont exactes avant soumission.

## 7. Notifications et suivi
- Vous recevez des notifications quand le statut d'une demande change.
- Les notifications peuvent etre lues individuellement ou toutes a la fois.
- Le compteur de non-lu vous aide a voir les mises a jour en attente.

## 8. Conseils d'utilisation
- Utilisez une connexion internet stable.
- Prenez des photos lisibles des pieces.
- Gardez votre email actif pour recevoir les informations de validation.
- Conservez vos fichiers certificat dans un emplacement securise.

## 9. Assistance
En cas de probleme:
- reconnectez-vous,
- verifiez internet,
- refaites la tentative,
- contactez le support du projet si le probleme persiste.

## 10. Emplacement du guide
- `frontend_mobile/docs/mobile-app-specification.md`
