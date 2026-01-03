# 🔒 Guide de Déploiement Sécurisé - Linxio Task

## ⚠️ Avant de Déployer

Ce guide vous aide à déployer Linxio Task de manière sécurisée sur votre serveur Hostinger.

## 📋 Prérequis

1. Accès SSH à votre serveur Hostinger
2. Docker et Docker Compose installés
3. Un domaine configuré (optionnel mais recommandé)

## 🔐 Étape 1: Générer les Secrets

**NE JAMAIS utiliser les valeurs par défaut "change_this_*" en production !**

### Générer des secrets sécurisés

```bash
# Sur votre machine locale ou sur le serveur
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
```

Copiez ces valeurs - vous en aurez besoin pour le fichier `.env`.

## 📝 Étape 2: Créer le Fichier .env

Sur votre serveur Hostinger :

```bash
# Cloner le projet (si pas déjà fait)
git clone https://github.com/Emma42971/linxio-task.git
cd linxio-task

# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier .env
nano .env
```

### Configuration minimale requise

```bash
# Database (remplacez par vos valeurs générées)
POSTGRES_USER=linxio_task
POSTGRES_PASSWORD=<votre_mot_de_passe_postgres_généré>
POSTGRES_DB=linxio_task

# Redis (remplacez par votre valeur générée)
REDIS_PASSWORD=<votre_mot_de_passe_redis_généré>

# URLs de production (remplacez par votre domaine)
FRONTEND_URL=https://votre-domaine.com
CORS_ORIGIN=https://votre-domaine.com
CORS_ORIGINS=https://votre-domaine.com
NEXT_PUBLIC_API_URL=https://votre-domaine.com/api
NEXT_PUBLIC_API_BASE_URL=https://votre-domaine.com/api

# Secrets de sécurité (remplacez par vos valeurs générées)
JWT_SECRET=<votre_jwt_secret_généré>
JWT_REFRESH_SECRET=<votre_refresh_secret_généré>
ENCRYPTION_KEY=<votre_encryption_key_générée>
```

## 🔒 Étape 3: Sécuriser le Fichier .env

```bash
# Restreindre les permissions
chmod 600 .env

# Vérifier que .env est dans .gitignore
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
```

## 🐳 Étape 4: Vérifier la Configuration Docker

```bash
# Valider la syntaxe du docker-compose.yml
docker compose config

# Si aucune erreur, vous êtes prêt
```

## 🚀 Étape 5: Démarrer les Services

```bash
# Construire et démarrer les conteneurs
docker compose up -d

# Vérifier les logs
docker compose logs -f

# Vérifier le statut
docker compose ps
```

## ✅ Étape 6: Vérifier la Santé des Services

```bash
# Vérifier PostgreSQL
docker inspect --format='{{json .State.Health}}' linxio-task-postgres | jq

# Vérifier Redis
docker inspect --format='{{json .State.Health}}' linxio-task-redis | jq

# Vérifier l'application
docker inspect --format='{{json .State.Health}}' linxio-task-app | jq

# Ou simplement
docker compose ps
```

## 🔍 Étape 7: Vérifier les Logs

```bash
# Logs de l'application
docker compose logs app

# Logs de PostgreSQL
docker compose logs postgres

# Logs de Redis
docker compose logs redis

# Tous les logs
docker compose logs -f
```

## 🛡️ Étape 8: Sécurité Post-Déploiement

### 1. Vérifier que les ports ne sont pas exposés publiquement

```bash
# Vérifier les ports ouverts
ss -tulpn | grep -E '(:3000|:5432|:6379)'

# Si PostgreSQL ou Redis sont exposés et que vous n'en avez pas besoin :
# Décommentez les sections "ports:" dans docker-compose.yml
```

### 2. Configurer le Firewall (UFW)

```bash
# Autoriser uniquement SSH, HTTP et HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### 3. Configurer Nginx comme Reverse Proxy (Recommandé)

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
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activez le site :

```bash
sudo ln -s /etc/nginx/sites-available/linxio-task /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Configurer SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Le renouvellement automatique est configuré
```

## 🔄 Commandes Utiles

### Redémarrer les services

```bash
docker compose restart
```

### Arrêter les services

```bash
docker compose down
```

### Mettre à jour l'application

```bash
# Récupérer les dernières modifications
git pull

# Reconstruire et redémarrer
docker compose up -d --build
```

### Voir les logs en temps réel

```bash
docker compose logs -f app
```

### Accéder à la base de données

```bash
# Via Docker
docker compose exec postgres psql -U linxio_task -d linxio_task

# Ou depuis l'extérieur (si port exposé)
psql -h localhost -p 5432 -U linxio_task -d linxio_task
```

### Sauvegarder la base de données

```bash
docker compose exec postgres pg_dump -U linxio_task linxio_task > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurer la base de données

```bash
docker compose exec -T postgres psql -U linxio_task linxio_task < backup_YYYYMMDD_HHMMSS.sql
```

## ⚠️ Checklist de Sécurité

- [ ] Tous les secrets "change_this_*" ont été remplacés
- [ ] Le fichier `.env` a les permissions 600
- [ ] Le fichier `.env` est dans `.gitignore`
- [ ] Les ports PostgreSQL et Redis ne sont pas exposés publiquement (commentés dans docker-compose.yml)
- [ ] Le firewall est configuré
- [ ] Nginx est configuré comme reverse proxy
- [ ] SSL/HTTPS est configuré avec Let's Encrypt
- [ ] Les URLs de production sont correctement configurées dans `.env`
- [ ] Les health checks passent pour tous les services

## 🆘 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker compose logs app

# Vérifier que les dépendances sont prêtes
docker compose ps

# Vérifier les variables d'environnement
docker compose exec app env | grep -E '(JWT|DATABASE|REDIS)'
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est en cours d'exécution
docker compose ps postgres

# Vérifier les logs
docker compose logs postgres

# Tester la connexion
docker compose exec postgres pg_isready -U linxio_task
```

### Erreur de connexion à Redis

```bash
# Vérifier que Redis est en cours d'exécution
docker compose ps redis

# Vérifier les logs
docker compose logs redis

# Tester la connexion
docker compose exec redis redis-cli -a $REDIS_PASSWORD ping
```

## 📚 Ressources

- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Documentation Hostinger](https://www.hostinger.com/tutorials)
- [Guide Nginx](https://nginx.org/en/docs/)

---

**Note** : En cas de problème, vérifiez toujours les logs en premier avec `docker compose logs -f`.

