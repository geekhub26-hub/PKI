# 🏗️ ARCHITECTURE TECHNIQUE - ITÉRATION 1

## Système Souverain de Gestion d'Identité (PKI)

---

## 📋 STACK TECHNOLOGIQUE

### Backend
- **Java 21** (LTS) avec Spring Boot 3.2+
- **Spring Security** pour JWT et sécurité
- **Bouncy Castle** pour cryptographie Java
- **OpenSSL CLI** pour opérations PKI (via ProcessBuilder)
- **PostgreSQL 15+** pour persistance
- **Maven** pour build management

### Frontend Web
- **React 18+** avec TypeScript
- **Vite** pour bundling
- **TailwindCSS** pour styling
- **Axios** pour API calls
- **React Router** pour navigation
- **Zustand/Redux** pour state management

### Frontend Mobile
- **Flutter 3.16+**
- **Dart 3.2+**
- **Provider/Riverpod** pour state management
- **http/dio** pour API calls
- **flutter_secure_storage** pour tokens

---

## 🏛️ ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                       │
├──────────────────────────┬──────────────────────────────────┤
│   Web (React)            │   Mobile (Flutter)               │
│   - Landing Page         │   - Landing Page                 │
│   - Auth (Login/Register)│   - Auth (Login/Register)        │
│   - Dashboard User       │   - Dashboard User               │
│   - Dashboard Admin      │   - Dashboard Admin              │
└──────────────┬───────────┴───────────────┬──────────────────┘
               │                           │
               │      API REST (HTTPS)     │
               │      JWT Authentication   │
               │                           │
┌──────────────┴───────────────────────────┴──────────────────┐
│                    COUCHE API (Java 21)                      │
├──────────────────────────────────────────────────────────────┤
│  Controllers:                                                │
│  - AuthController       (/api/auth/*)                        │
│  - UserController       (/api/users/*)                       │
│  - CertificateController (/api/certificates/*)               │
│  - AdminController      (/api/admin/*)                       │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────┴───────────────────────────────────────────────┐
│                  COUCHE SERVICES (Business Logic)            │
├──────────────────────────────────────────────────────────────┤
│  - AuthService          (JWT, login, register)               │
│  - UserService          (CRUD utilisateurs)                  │
│  - CertificateService   (Gestion certificats)                │
│  - PKIService           (Bridge OpenSSL)                     │
│  - AuditService         (Logging actions)                    │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────┴───────────────────────────────────────────────┐
│              COUCHE CRYPTOGRAPHIQUE                          │
├──────────────────────────────────────────────────────────────┤
│  OpenSSLManager:                                             │
│  - generateRootCA()     → ca.key + ca.crt                    │
│  - generateCSR()        → user.csr                           │
│  - signCertificate()    → user.crt                           │
│  - revokeCertificate()  → CRL update                         │
│                                                              │
│  Stockage Sécurisé:                                          │
│  /opt/pki/ca/           → AC Racine (permissions 600)        │
│  /opt/pki/certs/        → Certificats émis                   │
│  /opt/pki/crl/          → Certificate Revocation Lists       │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────┴───────────────────────────────────────────────┐
│                  BASE DE DONNÉES PostgreSQL                  │
├──────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  - users                 (Admin/User)                        │
│  - ca_configuration      (Config AC Racine)                  │
│  - certificate_requests  (CSR en attente)                    │
│  - certificates          (Certificats émis)                  │
│  - audit_logs            (Journal d'audit)                   │
│  - system_statistics     (Métriques dashboard)               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 SÉCURITÉ - ITÉRATION 1

### Authentification
- **JWT** (Access Token 15min, Refresh Token 7 jours)
- Hash mot de passe : **bcrypt** (cost factor 12)
- Protection CSRF pour Web
- Rate limiting sur endpoints sensibles

### Stockage des Clés
```
/opt/pki/
├── ca/
│   ├── ca.key          (chmod 600, propriétaire: pki-service)
│   ├── ca.crt          (chmod 644, lisible par tous)
│   └── serial          (numéro de série incrémental)
├── certs/
│   └── [user-id]/
│       ├── cert.crt
│       └── cert.p12
└── crl/
    └── ca.crl
```

### Transport
- **HTTPS obligatoire** (TLS 1.3)
- HSTS headers
- Certificats Let's Encrypt ou auto-signés (dev)

---

## 📡 API REST - ENDPOINTS ITÉRATION 1

### 🔓 Authentication (Public)
```
POST   /api/auth/register          → Inscription utilisateur
POST   /api/auth/login             → Connexion (retourne JWT)
POST   /api/auth/refresh           → Renouvellement token
POST   /api/auth/logout            → Déconnexion
POST   /api/auth/verify-email      → Validation email
```

### 👤 User (Authentifié)
```
GET    /api/users/me               → Profil utilisateur
PUT    /api/users/me               → Mise à jour profil
GET    /api/users/me/certificates  → Liste des certificats
GET    /api/users/me/dashboard     → Statistiques utilisateur
```

### 🔐 Admin (Role ADMIN)
```
GET    /api/admin/dashboard        → Dashboard admin (stats globales)
GET    /api/admin/users            → Liste des utilisateurs
GET    /api/admin/ca/status        → État de l'AC Racine
POST   /api/admin/ca/initialize    → Initialiser l'AC (1ère fois)
GET    /api/admin/requests/pending → Demandes en attente
GET    /api/admin/audit-logs       → Journal d'audit
```

### 📜 Certificates (Utilisateur)
```
POST   /api/certificates/request   → Créer une demande CSR
GET    /api/certificates/status    → Statut de ma demande
```

---

## 🗄️ MODÈLES DE DONNÉES (DTO Java)

### User
```java
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "USER|ADMIN",
  "isActive": true,
  "emailVerified": false,
  "createdAt": "2025-01-28T10:00:00Z",
  "lastLogin": "2025-01-28T14:30:00Z"
}
```

### JWT Response
```java
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": { /* User object */ }
}
```

### Dashboard Admin Response
```java
{
  "totalUsers": 42,
  "pendingRequests": 5,
  "activeCertificates": 38,
  "revokedCertificates": 2,
  "caStatus": "ACTIVE",
  "caValidUntil": "2035-01-28T00:00:00Z"
}
```

---

## 🛠️ CONFIGURATION ENVIRONNEMENT

### application.yml (Backend)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/pki_db
    username: pki_user
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

pki:
  ca:
    root-path: /opt/pki/ca
    certs-path: /opt/pki/certs
    crl-path: /opt/pki/crl
  openssl:
    binary: /usr/bin/openssl
  jwt:
    secret: ${JWT_SECRET}
    expiration: 900000  # 15 min
    refresh-expiration: 604800000  # 7 jours
```

---

## 🚀 DÉPLOIEMENT

### Prérequis Serveur
```bash
# OpenSSL
apt-get install openssl

# PostgreSQL
apt-get install postgresql-15

# Java 21
apt-get install openjdk-21-jdk

# Création utilisateur système
useradd -r -s /bin/false pki-service

# Création structure
mkdir -p /opt/pki/{ca,certs,crl}
chown -R pki-service:pki-service /opt/pki
chmod 700 /opt/pki/ca
```

---

## 📊 MÉTRIQUES & MONITORING (Itération 1)

- Logs applicatifs : **Logback** (JSON format)
- Métriques exposées : **Spring Actuator** (/actuator/health)
- Dashboard Admin : statistiques temps réel via PostgreSQL views

---

## 🔄 FLUX UTILISATEUR - ITÉRATION 1

### 1. Inscription
```
User → POST /api/auth/register
     → Email de confirmation
     → POST /api/auth/verify-email
     → Compte activé
```

### 2. Connexion
```
User → POST /api/auth/login
     → JWT retourné
     → GET /api/users/me/dashboard
     → Affichage "Aucun certificat actif"
```

### 3. Admin vérifie l'AC
```
Admin → GET /api/admin/ca/status
      → Si non initialisée: POST /api/admin/ca/initialize
      → AC Racine créée (ca.key + ca.crt)
```

---

## ✅ CHECKLIST ITÉRATION 1

- [x] Schéma PostgreSQL complet
- [ ] Backend Java 21 (Spring Boot)
- [ ] Service OpenSSL (génération AC)
- [ ] API REST (Auth + Admin + User)
- [ ] Frontend Web (React)
- [ ] Frontend Mobile (Flutter)
- [ ] Design System Figma
- [ ] Tests unitaires (JUnit)
- [ ] Documentation API (Swagger)

---

**Prochaine étape : Création du backend Java 21** 🚀