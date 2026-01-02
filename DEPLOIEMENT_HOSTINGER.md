# 🚀 Guide de Déploiement Hostinger - Linxio Task

## ✅ Configuration Validée

Tous les fichiers Docker ont été validés et sont prêts pour le déploiement sur Hostinger.

## 📋 Fichiers Essentiels

### Fichiers Docker
- ✅ `Dockerfile` - Image de production optimisée
- ✅ `docker-compose.yml` - Configuration complète (syntaxe YAML validée)
- ✅ `docker/entrypoint.sh` - Script d'initialisation automatique
- ✅ `.dockerignore` - Exclusion des fichiers inutiles

### Configuration
- ✅ `env.example` - Template de variables d'environnement
- ✅ `scripts/setup-docker.sh` - Installation automatique
- ✅ `scripts/validate-docker.sh` - Validation de la configuration

## 🎯 Déploiement sur Hostinger

### Option 1: Via l'Outil de Gestion Docker Hostinger

1. **Préparer le repository**
   ```bash
   git clone https://github.com/votre-username/linxio-task.git
   cd linxio-task
   ```

2. **Dans l'interface Hostinger**
   - Accédez à l'outil de gestion Docker
   - Cliquez sur "Nouveau projet" ou "Importer"
   - Sélectionnez le dossier `linxio-task`
   - L'outil détectera automatiquement `docker-compose.yml`

3. **Configurer les variables d'environnement**
   
   Dans l'interface Hostinger, configurez ces variables **OBLIGATOIRES** :
   
   ```env
   JWT_SECRET=<générer: openssl rand -base64 32>
   JWT_REFRESH_SECRET=<générer: openssl rand -base64 32>
   ENCRYPTION_KEY=<générer: openssl rand -base64 32>
   POSTGRES_PASSWORD=<votre mot de passe sécurisé>
   ```
   
   Et ces variables **RECOMMANDÉES** :
   
   ```env
   FRONTEND_URL=https://votre-domaine.com
   CORS_ORIGIN=https://votre-domaine.com
   REDIS_PASSWORD=<votre mot de passe Redis>
   ```

4. **Démarrer les services**
   - Cliquez sur "Démarrer" ou "Start"
   - Attendez que tous les services soient "Up"
   - Vérifiez les logs si nécessaire

### Option 2: Via SSH (Recommandé)

1. **Connectez-vous en SSH**
   ```bash
   ssh votre-utilisateur@votre-serveur-hostinger.com
   ```

2. **Clonez le repository**
   ```bash
   git clone https://github.com/votre-username/linxio-task.git
   cd linxio-task
   ```

3. **Lancez l'installation automatique**
   ```bash
   chmod +x scripts/setup-docker.sh
   ./scripts/setup-docker.sh
   ```
   
   Le script va :
   - ✅ Vérifier Docker et Docker Compose
   - ✅ Créer le fichier `.env` depuis `env.example`
   - ✅ Générer automatiquement les secrets sécurisés
   - ✅ Construire les images Docker
   - ✅ Démarrer tous les services

4. **Créer un utilisateur admin**
   ```bash
   docker-compose exec app sh -c "cd backend && npm run seed:admin"
   ```

5. **Vérifier que tout fonctionne**
   ```bash
   # Vérifier les logs
   docker-compose logs -f app
   
   # Vérifier le statut
   docker-compose ps
   
   # Tester l'API
   curl http://localhost:3000/api/health
   ```

## 🔧 Configuration Nginx (Optionnel mais Recommandé)

Si vous voulez utiliser votre propre domaine avec HTTPS :

1. **Créer la configuration Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/linxio-task
   ```

2. **Ajouter cette configuration**
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

3. **Activer le site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/linxio-task /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Configurer HTTPS avec Let's Encrypt**
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d votre-domaine.com
   ```

5. **Mettre à jour les variables d'environnement**
   ```bash
   # Dans .env ou via l'interface Hostinger
   FRONTEND_URL=https://votre-domaine.com
   CORS_ORIGIN=https://votre-domaine.com
   ```
   
   Puis redémarrer :
   ```bash
   docker-compose restart app
   ```

## 📊 Commandes Utiles

### Gestion des Services

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

### Base de Données

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

### Secrets à Générer

Générez des secrets sécurisés avec :

```bash
# JWT Secret (32+ caractères)
openssl rand -base64 32

# Encryption Key (32+ caractères)
openssl rand -base64 32

# Mots de passe (24 caractères)
openssl rand -base64 24
```

### Bonnes Pratiques

- ✅ Ne jamais commiter le fichier `.env`
- ✅ Utiliser des secrets différents en production
- ✅ Activer HTTPS en production
- ✅ Configurer un firewall
- ✅ Faire des backups réguliers

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

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Vérifier les logs PostgreSQL
docker-compose logs postgres

# Tester la connexion
docker-compose exec postgres pg_isready -U linxio_task
```

### Port déjà utilisé

Modifiez `APP_PORT` dans `.env` :
```env
APP_PORT=3001
```

Puis redémarrez :
```bash
docker-compose up -d
```

## ✅ Checklist de Déploiement

- [ ] Repository cloné sur le serveur
- [ ] Fichier `.env` créé et configuré
- [ ] Secrets générés (JWT_SECRET, ENCRYPTION_KEY, etc.)
- [ ] Variables d'environnement configurées
- [ ] Services démarrés avec `docker-compose up -d`
- [ ] Logs vérifiés (aucune erreur)
- [ ] Health check passé (`/api/health` répond)
- [ ] Utilisateur admin créé
- [ ] Application accessible via navigateur
- [ ] HTTPS configuré (optionnel mais recommandé)

## 🎉 C'est Prêt !

Une fois tous les points de la checklist validés, votre application Linxio Task est déployée et fonctionnelle sur Hostinger !

---

**Support** : Pour toute question, consultez les logs avec `docker-compose logs -f app`

