# PKI Souverain — Lancement en local

Plateforme de gestion de certificats numériques de l'ANTIC Cameroun.

## Architecture

| Composant | Technologie | Port local |
|---|---|---|
| Backend API | Spring Boot 3 / Java 21 | `8080` |
| Frontend Web | React + Vite + TypeScript + Tailwind | `5173` |
| Base de données | PostgreSQL 15 | `5432` |
| Validateur IA | Python 3.11 + FastAPI + OpenCV | `8000` |

---

## Prérequis

- **Java 21** — [temurin.net](https://adoptium.net)
- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **PostgreSQL 15+** — [postgresql.org](https://www.postgresql.org/download)
- **Python 3.11+** — [python.org](https://www.python.org/downloads)
- **Tesseract OCR** (pour le validateur IA) :
  - Linux : `sudo apt-get install tesseract-ocr tesseract-ocr-fra`
  - macOS : `brew install tesseract`
  - Windows : [github.com/UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) → ajouter le binaire au `PATH`
- **OpenSSL** (généralement déjà installé sur Linux/macOS)

---

## 1. Base de données PostgreSQL

```bash
# Créer la base et l'utilisateur
psql -U postgres -c "CREATE DATABASE pki_souverain;"
psql -U postgres -c "CREATE USER pki_user WITH PASSWORD 'pki_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pki_souverain TO pki_user;"
```

Les migrations Flyway (V1 → V12) s'appliquent automatiquement au démarrage du backend.

---

## 2. Backend Spring Boot

### Variables d'environnement

Créer un fichier `.env` dans `backend/` (ou les exporter dans le terminal) :

```env
# Base de données
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pki_souverain
SPRING_DATASOURCE_USERNAME=pki_user
SPRING_DATASOURCE_PASSWORD=pki_password

# JWT (générer une clé aléatoire, min. 32 caractères)
JWT_SECRET=votre-secret-jwt-tres-long-et-aleatoire-ici

# Compte administrateur initial (créé au 1er démarrage)
PKI_BOOTSTRAP_ADMIN_EMAIL=admin@pki.local
PKI_BOOTSTRAP_ADMIN_PASSWORD=Admin@123
PKI_BOOTSTRAP_ADMIN_FIRST_NAME=Administrateur
PKI_BOOTSTRAP_ADMIN_LAST_NAME=Systeme

# Autorité de certification
PKI_CA_DEFAULT_KEYSTORE_PASSWORD=pki-keystore-password

# Email (mode debug : affiche les emails dans les logs, n'envoie rien)
PKI_EMAIL_DEBUG_MODE=true
# Pour l'envoi réel via Brevo, désactiver le mode debug et ajouter :
# BREVO_API_KEY=votre-cle-brevo
# SMTP_HOST=smtp-relay.brevo.com
# SMTP_PORT=587
# SMTP_USERNAME=votre-login-brevo
# SMTP_PASSWORD=votre-mdp-brevo

# Frontend URL (pour les liens dans les emails)
FRONTEND_URL=http://localhost:5173

# Validateur IA (optionnel)
# PKI_ID_AI_PROVIDER=local
# PKI_ID_AI_LOCAL_URL=http://localhost:8000/validate
# PKI_ID_AI_STRICT_MODE=false
```

### Lancement

```bash
cd backend

# Linux / macOS
export $(cat .env | xargs)
./mvnw spring-boot:run

# Windows PowerShell
Get-Content .env | ForEach-Object { $k,$v = $_ -split '=',2; [System.Environment]::SetEnvironmentVariable($k,$v) }
.\mvnw.cmd spring-boot:run
```

L'API est disponible sur **http://localhost:8080/api**  
Swagger UI : **http://localhost:8080/api/swagger-ui.html**

---

## 3. Frontend Web

```bash
cd PKI-web

# Installer les dépendances
npm install

# Lancer en mode développement (proxie /api vers http://localhost:8080)
npm run dev
```

> Le proxy `/api` est déjà configuré dans `vite.config.ts` — si ton backend tourne sur le port 8080 local, aucune config supplémentaire n'est nécessaire.
>
> Pour pointer vers le backend Render (production), éditer `vite.config.ts` :
> ```ts
> proxy: { '/api': { target: 'https://pki-1.onrender.com' } }
> ```

L'interface est disponible sur **http://localhost:5173**

---

## 4. Validateur IA (optionnel)

Valide les pièces d'identité (CNI / Passeport) et compare le selfie avec le document.

```bash
cd ai-doc-validator

# Créer l'environnement virtuel
python -m venv .venv

# Activer l'environnement
source .venv/bin/activate        # Linux / macOS
.venv\Scripts\activate           # Windows PowerShell

# Installer les dépendances
pip install -r requirements.txt

# Lancer le service
uvicorn app:app --host 0.0.0.0 --port 8000
```

Au **premier démarrage**, les modèles de reconnaissance faciale (~37 MB) sont téléchargés automatiquement depuis OpenCV Zoo dans `/tmp/pki-models/`.

Endpoints disponibles :

| Méthode | URL | Description |
|---|---|---|
| `GET` | `/health` | Statut du service + état des modèles IA |
| `POST` | `/validate` | Validation pièce d'identité (CNI / Passeport) |
| `POST` | `/compare-faces` | Comparaison selfie ↔ pièce d'identité |

Puis activer dans le backend :

```env
PKI_ID_AI_PROVIDER=local
PKI_ID_AI_LOCAL_URL=http://localhost:8000/validate
PKI_ID_AI_STRICT_MODE=false
```

---

## 5. Structure du projet

```
PKI/
├── backend/                  # Spring Boot API (branche main)
│   ├── src/main/java/cm/gov/pki/
│   │   ├── controller/       # REST controllers
│   │   ├── service/          # Logique métier
│   │   ├── entity/           # Entités JPA
│   │   └── security/         # JWT + Spring Security
│   └── src/main/resources/
│       ├── application.yml   # Configuration
│       └── db/migration/     # Migrations Flyway (V1–V12)
│
├── PKI-web/                  # Frontend React (branche frontend-web)
│   ├── src/
│   │   ├── pages/            # Pages (Dashboard, CSR, Admin…)
│   │   ├── components/       # Composants réutilisables
│   │   └── services/api.ts   # Client API centralisé
│   └── vite.config.ts
│
├── ai-doc-validator/         # Service Python IA (branche main)
│   ├── app.py                # FastAPI app
│   └── requirements.txt
│
└── database/
    └── schema_iteration1.sql # Schéma de référence (non exécuté directement)
```

---

## 6. Rôles et accès

| Rôle | Description |
|---|---|
| `USER` | Soumet des demandes de certificat |
| `ADMIN` | Valide/rejette les demandes, gère les récépissés |
| `AE_CENTRALE` | Autorité d'enregistrement centrale |
| `ADMIN_AEL` | Administrateur autorité d'enregistrement locale |
| `AEL` | Autorité d'enregistrement locale |
| `SUPER_ADMIN` | Accès total, gestion du système |

Le compte `SUPER_ADMIN` initial est créé via les variables `PKI_BOOTSTRAP_ADMIN_*` au premier démarrage.

---

## 7. Déploiement sur Render

Les trois services sont déployés sur Render :

| Service | Branche | Dossier racine |
|---|---|---|
| Backend API | `main` | `backend/` |
| Frontend Web | `frontend-web` | `/` (racine) |
| Validateur IA | `main` | `ai-doc-validator/` |

Variables d'environnement à configurer dans le dashboard Render (voir section 2).  
La variable `BREVO_API_KEY` remplace SMTP pour contourner le blocage du port 587 sur Render.

---

## Développement

```bash
# Vérifier le typage TypeScript
cd PKI-web && npx tsc --noEmit

# Compiler le backend sans tests
cd backend && ./mvnw compile

# Builder le frontend pour production
cd PKI-web && npm run build
```
