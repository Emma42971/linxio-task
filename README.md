# 🚀 Linxio Task

**Gestion de projet open source avec IA conversationnelle pour l'exécution de tâches**

Linxio Task est une plateforme de gestion de projet open source qui combine les fonctionnalités traditionnelles de gestion de projet avec une IA conversationnelle pour l'exécution de tâches. Au lieu de naviguer dans les menus et formulaires, vous pouvez créer des tâches, assigner du travail et gérer les workflows en décrivant simplement ce dont vous avez besoin.

![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)
![NestJS](https://img.shields.io/badge/nestjs-%5E11.0.0-red.svg)
![Next.js](https://img.shields.io/badge/nextjs-15.2.2-black.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D16-blue.svg)
![Redis](https://img.shields.io/badge/redis-%3E%3D7-red.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## ✨ Fonctionnalités Principales

- 🤖 **IA Conversationnelle** - Exécutez des tâches de projet par conversation naturelle directement dans l'application
- 💬 **Commandes en Langage Naturel** - "Créer un sprint avec les bugs prioritaires de la semaine dernière" s'exécute automatiquement
- 🏠 **Auto-hébergé** - Vos données restent sur votre infrastructure
- 💰 **Apportez Votre Propre LLM** - Utilisez votre propre clé API avec OpenAI, Anthropic, OpenRouter, ou modèles locaux
- 📊 **Gestion de Projet Complète** - Tableaux Kanban, sprints, dépendances de tâches, suivi du temps
- 🌐 **Open Source** - Disponible sous licence Business Source License (BSL)
- 🐳 **Installation Docker Automatique** - Déployez en quelques minutes

## 🚀 Installation Rapide avec Docker

### Installation en 3 étapes

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/linxio-task.git
cd linxio-task

# 2. Lancer le script d'installation automatique
chmod +x scripts/setup-docker.sh
./scripts/setup-docker.sh

# 3. Créer un utilisateur admin
docker-compose exec app sh -c "cd backend && npm run seed:admin"
```

C'est tout ! L'application est disponible sur `http://localhost:3000`

### Installation Manuelle

```bash
# 1. Configurer l'environnement
cp env.example .env
# Éditez .env et configurez vos variables

# 2. Lancer avec Docker Compose
docker-compose up -d
```

📖 **Documentation Docker complète** : Voir [README_DOCKER.md](./README_DOCKER.md)

## 📋 Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Au moins 2GB de RAM
- Port 3000 disponible (configurable)

## 🏗️ Architecture

```
Linxio Task
├── Backend (NestJS)
│   ├── API REST
│   ├── WebSocket (Socket.io)
│   ├── Prisma ORM
│   └── Bull Queue (Redis)
├── Frontend (Next.js)
│   ├── React 18
│   ├── TypeScript
│   └── Tailwind CSS
└── Infrastructure
    ├── PostgreSQL
    └── Redis
```

## 🔧 Configuration

### Variables d'environnement essentielles

Créez un fichier `.env` à partir de `env.example` :

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/linxio_task

# Sécurité (GÉNÉRER AVEC: openssl rand -base64 32)
JWT_SECRET=votre_secret_jwt
JWT_REFRESH_SECRET=votre_secret_refresh
ENCRYPTION_KEY=votre_cle_chiffrement

# URLs
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Redis (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🎯 Utilisation

### Créer un projet

1. Connectez-vous à l'application
2. Créez une organisation
3. Créez un workspace
4. Créez un projet

### Utiliser l'IA conversationnelle

1. Ouvrez le chat IA dans l'application
2. Décrivez ce que vous voulez faire : "Créer une tâche pour implémenter l'authentification"
3. L'IA exécute automatiquement l'action

### Gérer les tâches

- **Vue Liste** : Liste classique des tâches
- **Vue Kanban** : Tableaux Kanban par statut
- **Vue Gantt** : Timeline visuelle avec dépendances
- **Sprints** : Gestion agile avec sprints

## 📚 Documentation

- [Installation Docker Complète](./README_DOCKER.md)
- [Guide de Déploiement Hostinger](./README_DOCKER.md#déploiement-sur-hostinger)
- [API Documentation](./backend/README.md)
- [Architecture](./docs/ARCHITECTURE.md)

## 🛠️ Développement

### Prérequis de développement

- Node.js 22+
- PostgreSQL 16+
- Redis 7+ (optionnel)
- npm ou yarn

### Installation locale

```bash
# Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## 🐳 Déploiement

### Docker (Recommandé)

Voir [README_DOCKER.md](./README_DOCKER.md) pour les instructions complètes.

### Hostinger VPS

1. Connectez-vous en SSH à votre serveur
2. Clonez le repository
3. Exécutez `./scripts/setup-docker.sh`
4. Configurez Nginx pour HTTPS
5. C'est tout !

Voir [README_DOCKER.md](./README_DOCKER.md#déploiement-sur-hostinger) pour les détails.

## 🔒 Sécurité

- ✅ Authentification JWT
- ✅ Chiffrement des données sensibles
- ✅ Headers de sécurité (Helmet)
- ✅ Validation des entrées
- ✅ Protection CSRF
- ✅ Rate limiting

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence Business Source License (BSL). Voir [LICENSE.md](./LICENSE.md) pour plus de détails.

## 🆘 Support

- 📧 Email : support@linxio.com
- 🐛 Issues : [GitHub Issues](https://github.com/votre-username/linxio-task/issues)
- 📖 Documentation : [Wiki](https://github.com/votre-username/linxio-task/wiki)

## 🙏 Remerciements

- NestJS pour le framework backend
- Next.js pour le framework frontend
- Prisma pour l'ORM
- Tous les contributeurs open source

---

**Linxio Task** - Fait avec ❤️ pour la gestion de projet moderne
