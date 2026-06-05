# PKI SOUVERAIN - Mobile Design Brief

## Table des matières
1. Objectif
2. Utilisateurs cibles
3. Parcours utilisateur
4. Architecture des écrans
5. Spécification par écran
6. Navigation
7. Design system cible
8. État actuel du design (important)
9. Gaps à corriger dans la maquette
10. Checklist Figma

## 1. Objectif
Cette documentation sert à produire une maquette mobile complète, cohérente et prête à implémenter pour PKI SOUVERAIN (côté utilisateur).

## 2. Utilisateurs cibles
- Citoyens et professionnels non techniques
- Utilisateurs mobiles Android/iOS
- Besoin: soumettre une demande, suivre la validation, finaliser CSR, récupérer le certificat

## 3. Parcours utilisateur
1. Landing
2. Login/Register
3. Dashboard
4. Nouvelle demande (Phase 1+2)
5. Revue admin (attente)
6. Phase 3 CSR
7. Validation token
8. Certificat émis + téléchargement
9. Notifications & suivi

## 4. Architecture des écrans
- Landing
- Login
- Register
- Dashboard
- Requests
- New Request
- Phase 3 CSR
- Token Validation
- Certificates
- Notifications
- Settings
- Documentation in-app

## 5. Spécification par écran
## 5.1 Landing
- Hero sécurité
- CTA: Get Started
- CTA: View Documentation
- Workflow 3 étapes
- Cartes de valeur
- Footer nav marketing

## 5.2 Login/Register
- Inputs simples, validations, erreurs lisibles
- Actions claires de navigation entre les 2 écrans

## 5.3 Dashboard
- 3 KPI (review, phase3, certifs)
- Bloc lancement nouvelle demande
- Activité récente
- Statut système
- Bloc Secure Action

## 5.4 Requests
- Liste des demandes
- Badge statut par demande
- Actions rapides (Validate / Phase 3)

## 5.5 New Request (Phase 1+2)
- Profil identité (nom, date/lieu naissance, nationalité, pièce)
- Détails certificat (CN/O/L/C/email)
- Upload documents
- Save Draft / Submit Request

## 5.6 Phase 3 CSR
- Soumission CSR externe (.pem/.csr)
- Génération côté serveur
- CTA validation token

## 5.7 Token Validation
- Request ID + Token
- Verify
- Historique alertes + actions contextuelles

## 5.8 Certificates
- Analytics du coffre
- Cartes certificats
- Download .crt / .pem / .p12

## 5.9 Notifications
- Liste lu/non-lu
- Mark all as read
- Redirections contextualisées

## 5.10 Settings
- Profil
- Notifications
- Docs
- Token
- Logout

## 6. Navigation
Bottom tabs:
1. Dashboard
2. Requests
3. Certificates
4. Identity
5. Settings

Règle: Les actions métier majeures naviguent vers l’onglet cible (pas d’empilement inutile d’écrans).

## 7. Design system cible
- Fond: #050B24
- Cartes: #0A1748
- Bordure: #2A4A8D
- CTA principal: #6F8DFF
- Accent cyan: #4FD7FF
- Texte principal: #EAF0FF
- Texte secondaire: #B8C8ED
- Succès: #6FFFC8
- Erreur: #FF9DB5

Typo:
- H1: 34-42 bold
- H2: 22-28 bold
- Body: 15-17 regular
- Caption: 12-13

## 8. État actuel du design (important)
Cette section décrit comment l’app mobile est actuellement, pour faciliter ta maquette fidèle à la réalité existante.

### 8.1 Points déjà bons
- Direction visuelle dark-tech déjà en place
- Palette proche de la charte web
- Cartes arrondies + bordures cohérentes
- Pages clés déjà stylées: Dashboard, New Request, Phase 3, Certificates, Token, Settings
- Plusieurs boutons déjà branchés à des destinations utiles

### 8.2 Incohérences visuelles observées
- Certains espacements verticaux varient trop entre pages
- Quelques tailles de titres ne sont pas uniformes
- Densité d’info différente selon cartes (certaines surchargées)
- Icônes parfois hétérogènes (poids/tailles)
- Badges de statut pas toujours au même style exact

### 8.3 Incohérences de navigation observées
- Avant correction, certaines actions ouvraient des pages en push au lieu de changer d’onglet
- Certaines actions secondaires existent mais doivent encore être validées en test complet de flux

### 8.4 Problèmes techniques UI déjà rencontrés
- `RenderFlex overflow` horizontal sur mobiles étroits
- `No Material widget found` sur certains `InkWell`

Correctifs déjà appliqués:
- `Expanded/Flexible + ellipsis` sur zones sensibles
- wrappers `Material(type: MaterialType.transparency)` autour de zones cliquables

### 8.5 Ce que ta maquette doit impérativement harmoniser
- Échelle typographique globale
- Espacement standard par section
- Style unique des boutons primaires/secondaires
- Style unique des badges de statut
- Grammaire visuelle des cartes (header, contenu, actions)
- États vides / erreurs / succès uniformes

## 9. Gaps à corriger dans la maquette
- Uniformiser toutes les grilles de contenu
- Prévoir variantes long-text (titres, messages)
- Prévoir comportement petits écrans (320-360px)
- Prévoir états de chargement (skeleton/spinner)
- Prévoir états désactivés des boutons selon statut de demande

## 10. Checklist Figma
- [ ] Composants globaux (buttons, inputs, cards, badges)
- [ ] Styles texte + couleurs nommés
- [ ] 11 écrans maquettes finalisés
- [ ] États: default/loading/error/empty/success
- [ ] Prototype cliquable bout-en-bout
- [ ] Test responsive mobile compact
- [ ] Notes handoff dev (marges, tailles, comportements)

---

Document créé pour: `frontend_mobile/docs/mobile-design-brief.md`
