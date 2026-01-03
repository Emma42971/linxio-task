# 🐳 Linxio Task - Installation Docker Complète

Guide d'installation automatique de Linxio Task avec Docker.

## 🚀 Installation Rapide (3 étapes)

### 1. Cloner et configurer

```bash
git clone https://github.com/votre-username/linxio-task.git
cd linxio-task
chmod +x scripts/setup-docker.sh
./scripts/setup-docker.sh
```

Le script va :
- ✅ Vérifier Docker et Docker Compose
- ✅ Créer le fichier `.env` depuis `env.example`
- ✅ Générer automatiquement les secrets sécurisés
- ✅ Construire les images Docker
- ✅ Démarrer tous les services

### 2. Configurer votre domaine (optionnel)

Éditez `.env` et modifiez :

```env
FRONTEND_URL=https://votre-domaine.com
CORS_ORIGIN=https://votre-domaine.com
```

### 3. Créer un utilisateur admin

```bash
docker-compose exec app sh -c "cd backend && npm run seed:admin"
```

C'est tout ! L'application est disponible sur `http://localhost:3000`

## 📋 Installation Manuelle

Si vous préférez installer manuellement :

### 1. Créer le fichier .env

```bash
cp env.example .env
```

### 2. Configurer les variables d'environnement

Éditez `.env` et configurez au minimum :

```env
# Générer des secrets (exécutez ces commandes)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
REDIS_PASSWORD=$(openssl rand -base64 24)

# Configurer votre URL
FRONTEND_URL=https://votre-domaine.com
CORS_ORIGIN=https://votre-domaine.com
```

### 3. Lancer avec Docker Compose

```bash
docker-compose up -d
```

## 🔧 Déploiement sur Hostinger

### Prérequis Hostinger

1. **VPS Hostinger** avec accès SSH
2. **Docker et Docker Compose** installés
3. **Domaine** configuré (optionnel mais recommandé)

### Étapes de déploiement

#### 1. Connectez-vous en SSH

```bash
ssh votre-utilisateur@votre-serveur-hostinger.com
```

#### 2. Installez Docker (si nécessaire)

```bash
# Sur Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installez Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. Clonez le repository

```bash
git clone https://github.com/votre-username/linxio-task.git
cd linxio-task
```

#### 4. Configurez l'environnement

```bash
cp env.example .env
nano .env  # ou utilisez votre éditeur préféré
```

Configurez au minimum :
- `FRONTEND_URL` avec votre domaine
- `CORS_ORIGIN` avec votre domaine
- Tous les secrets (générés automatiquement par le script)

#### 5. Lancez l'application

```bash
chmod +x scripts/setup-docker.sh
./scripts/setup-docker.sh
```

Ou manuellement :

```bash
docker-compose up -d
```

#### 6. Configurez Nginx (pour HTTPS)

Créez `/etc/nginx/sites-available/linxio-task` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez le site :

```bash
sudo ln -s /etc/nginx/sites-available/linxio-task /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. Configurez HTTPS avec Let's Encrypt

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

#### 8. Créez un utilisateur admin

```bash
docker-compose exec app sh -c "cd backend && npm run seed:admin"
```

## 📦 Commandes Utiles

### Gestion de l'application

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Redémarrer
docker-compose restart app

# Voir les logs
docker-compose logs -f app

# Voir le statut
docker-compose ps
```

### Base de données

```bash
# Accéder à PostgreSQL
docker-compose exec postgres psql -U linxio_task -d linxio_task

# Backup
docker-compose exec postgres pg_dump -U linxio_task linxio_task > backup.sql

# Restaurer
docker-compose exec -T postgres psql -U linxio_task linxio_task < backup.sql

# Exécuter les migrations
docker-compose exec app sh -c "cd backend && npx prisma migrate deploy"
```

### Maintenance

```bash
# Mettre à jour l'application
git pull
docker-compose build --no-cache
docker-compose up -d

# Nettoyer les images inutilisées
docker system prune -a

# Voir l'utilisation des ressources
docker stats
```

## 🔒 Sécurité

### Secrets requis

Tous ces secrets doivent être configurés dans `.env` :

- `JWT_SECRET` - Secret pour signer les JWT (32+ caractères)
- `JWT_REFRESH_SECRET` - Secret pour les refresh tokens (32+ caractères)
- `ENCRYPTION_KEY` - Clé de chiffrement (32+ caractères)
- `POSTGRES_PASSWORD` - Mot de passe PostgreSQL
- `REDIS_PASSWORD` - Mot de passe Redis (optionnel mais recommandé)

### Génération de secrets

```bash
# Générer un secret sécurisé
openssl rand -base64 32
```

### Bonnes pratiques

1. ✅ Ne jamais commiter le fichier `.env`
2. ✅ Utiliser des secrets différents en production
3. ✅ Activer HTTPS en production
4. ✅ Configurer un firewall
5. ✅ Faire des backups réguliers

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker-compose logs app

# Vérifier la configuration
docker-compose config

# Vérifier les services
docker-compose ps
```

### Problèmes de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Vérifier les logs PostgreSQL
docker-compose logs postgres

# Tester la connexion
docker-compose exec postgres pg_isready -U linxio_task
```

### Problèmes de permissions

```bash
# Corriger les permissions des volumes
sudo chown -R $USER:$USER ./postgres_data
sudo chown -R $USER:$USER ./redis_data
```

### Port déjà utilisé

Si le port 3000 est déjà utilisé, modifiez dans `.env` :

```env
APP_PORT=3001
```

Et dans `docker-compose.yml`, changez le mapping de port.

## 📊 Monitoring

### Health Check

L'application expose un endpoint de health check :

```bash
curl http://localhost:3000/api/health
```

### Logs en temps réel

```bash
docker-compose logs -f app
```

### Statistiques des conteneurs

```bash
docker stats
```

## 🔄 Mise à jour

### Mettre à jour l'application

```bash
# Arrêter l'application
docker-compose down

# Récupérer les dernières modifications
git pull

# Reconstruire les images
docker-compose build --no-cache

# Redémarrer
docker-compose up -d

# Exécuter les migrations si nécessaire
docker-compose exec app sh -c "cd backend && npx prisma migrate deploy"
```

## 📝 Notes Importantes

- Les données sont persistantes dans les volumes Docker
- Les backups sont stockés localement (configurez un backup cloud pour la production)
- Pour la production, utilisez un reverse proxy (Nginx) avec HTTPS
- Configurez un monitoring (optionnel mais recommandé)

## 🆘 Support

Pour toute question :
- Consultez les logs : `docker-compose logs -f`
- Ouvrez une issue sur GitHub
- Vérifiez la documentation complète

---

**Linxio Task** - Gestion de projet open source avec IA conversationnelle

