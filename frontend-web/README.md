# PKI Souverain - Frontend Web

Application web React + TypeScript pour la plateforme **PKI Souverain**.

## Stack technique

- React 18
- TypeScript
- Vite 5
- Tailwind CSS
- Axios
- Zustand

## Fonctionnalites principales

- Authentification (connexion / inscription / reset mot de passe)
- Espace utilisateur:
  - Nouvelle demande de certificat (workflow multi-etapes)
  - Suivi des demandes
  - Gestion / telechargement des certificats
- Espace administrateur:
  - Gestion des demandes
  - Signature CSR
  - Gestion CA / CRL
- Theme clair / sombre
- UI responsive (desktop + mobile)

## Demarrage en local

### Prerequis

- Node.js 20+ (recommande: 22)
- npm

### Installation

```bash
npm ci
```

### Lancer en developpement

```bash
npm run dev
```

### Build production

```bash
npm run build
```

### Preview local du build

```bash
npm run preview
```

## Variables d'environnement

Le frontend utilise l'URL backend via variable Vite.

Exemple:

```env
VITE_API_BASE_URL=https://pki-backend.onrender.com/api
```

## Deploiement Render (Static Site)

Configuration recommandee:

- **Branch**: `frontend-web`
- **Root Directory**: `frontend-web`
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `dist`

Pour les routes SPA (`/login`, `/forgot-password`, etc.), ajouter une regle de rewrite vers `index.html`.

## Scripts npm

- `npm run dev` : demarrage dev
- `npm run build` : build production
- `npm run preview` : preview du build

## Structure rapide

```text
src/
  components/      # composants UI
  pages/           # pages applicatives
  services/        # appels API (axios)
  stores/          # etat global (zustand)
```

## Notes

- `dist/` et `node_modules/` ne doivent pas etre commits.
- Le backend doit etre deploye et accessible pour les appels API.
