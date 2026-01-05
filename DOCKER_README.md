# 🐳 Linxio Task - Installation Docker

Guide complet pour installer et déployer Linxio Task avec Docker.

## 📋 Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Au moins 2GB de RAM disponible
- Port 3000 disponible (ou configurer un autre port)

## 🚀 Installation Rapide

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/linxio-task.git
cd linxio-task
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditez le fichier `.env` et configurez au minimum :

```env
# Générer des secrets sécurisés
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Configurer les mots de passe
POSTGRES_PASSWORD=votre_mot_de_passe_securise
REDIS_PASSWORD=votre_mot_de_passe_redis

# Configurer l'URL de votre application
FRONTEND_URL=https://votre-domaine.com
CORS_ORIGIN=https://votre-domaine.com
```

### 3. Lancer l'application

```bash
docker-compose up -d
```

### 4. Vérifier les logs

```bash
docker-compose logs -f app
```

L'application sera disponible sur `http://localhost:3000` (ou l'URL configurée).

## 🔧 Configuration pour Hostinger

### Option 1: Docker sur VPS Hostinger

Si vous avez un VPS Hostinger avec Docker installé :

1. **Connectez-vous en SSH** à votre serveur
2. **Clonez le repository** :
   ```bash
   git clone https://github.com/votre-username/linxio-task.git
   cd linxio-task
   ```

3. **Configurez `.env`** avec votre domaine :
   ```env
   FRONTEND_URL=https://votre-domaine.com
   CORS_ORIGIN=https://votre-domaine.com
   APP_PORT=3000
   ```

4. **Lancez avec Docker Compose** :
   ```bash
   docker-compose up -d
   ```

5. **Configurez Nginx** (si nécessaire) pour reverse proxy :
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
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Hostinger avec Docker Compose

Hostinger supporte Docker Compose. Suivez les mêmes étapes que ci-dessus.

## 📦 Commandes Utiles

### Démarrer l'application
```bash
docker-compose up -d
```

### Arrêter l'application
```bash
docker-compose down
```

### Voir les logs
```bash
docker-compose logs -f app
```

### Redémarrer l'application
```bash
docker-compose restart app
```

### Accéder à la base de données
```bash
docker-compose exec postgres psql -U linxio_task -d linxio_task
```

### Exécuter les migrations
```bash
docker-compose exec app sh -c "cd backend && npx prisma migrate deploy"
```

### Créer un utilisateur admin
```bash
docker-compose exec app sh -c "cd backend && npm run seed:admin"
```

### Backup de la base de données
```bash
docker-compose exec postgres pg_dump -U linxio_task linxio_task > backup.sql
```

### Restaurer la base de données
```bash
docker-compose exec -T postgres psql -U linxio_task linxio_task < backup.sql
```

## 🔒 Sécurité

### Génération de secrets sécurisés

```bash
# JWT Secret
openssl rand -base64 32

# Encryption Key
openssl rand -base64 32

# Redis Password
openssl rand -base64 24
```

### Configuration HTTPS

Pour la production, configurez HTTPS avec Let's Encrypt :

```bash
# Installer Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d votre-domaine.com
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
```

## 🐛 Dépannage

### L'application ne démarre pas

1. Vérifiez les logs :
   ```bash
   docker-compose logs app
   ```

2. Vérifiez que les variables d'environnement sont correctes :
   ```bash
   docker-compose config
   ```

3. Vérifiez que les ports ne sont pas utilisés :
   ```bash
   netstat -tulpn | grep 3000
   ```

### La base de données ne se connecte pas

1. Vérifiez que PostgreSQL est démarré :
   ```bash
   docker-compose ps postgres
   ```

2. Vérifiez les logs PostgreSQL :
   ```bash
   docker-compose logs postgres
   ```

3. Testez la connexion :
   ```bash
   docker-compose exec postgres pg_isready -U linxio_task
   ```

### Problèmes de permissions

Si vous avez des problèmes de permissions avec les volumes :

```bash
sudo chown -R $USER:$USER ./postgres_data
sudo chown -R $USER:$USER ./redis_data
```

## 📊 Monitoring

### Vérifier l'état des services

```bash
docker-compose ps
```

### Vérifier l'utilisation des ressources

```bash
docker stats
```

### Health check

L'application expose un endpoint de health check :
```
GET http://localhost:3000/api/health
```

## 🔐 Variables d'environnement importantes

| Variable | Description | Requis |
|----------|-------------|--------|
| `JWT_SECRET` | Secret pour signer les JWT | ✅ Oui |
| `JWT_REFRESH_SECRET` | Secret pour les refresh tokens | ✅ Oui |
| `ENCRYPTION_KEY` | Clé de chiffrement (32+ caractères) | ✅ Oui |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | ✅ Oui |
| `DATABASE_URL` | URL de connexion PostgreSQL | ✅ Oui |
| `FRONTEND_URL` | URL de l'application frontend | ✅ Oui |
| `SMTP_HOST` | Serveur SMTP (optionnel) | ❌ Non |
| `OPENAI_API_KEY` | Clé API OpenAI (optionnel) | ❌ Non |

## 📝 Notes

- Les données sont persistantes dans les volumes Docker
- Les backups sont recommandés régulièrement
- Pour la production, utilisez des secrets sécurisés
- Configurez un reverse proxy (Nginx) pour HTTPS

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation complète
- Vérifiez les logs avec `docker-compose logs`

---

**Linxio Task** - Gestion de projet open source avec IA conversationnelle


