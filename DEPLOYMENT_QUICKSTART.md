# 🚀 Deployment Quickstart - Linxio Task

## Prérequis

- Docker et Docker Compose installés
- NPM (Nginx Proxy Manager) configuré avec réseau `proxy`
- Accès SSH au serveur

## Déploiement en 5 Minutes

### 1. Cloner le Repository

```bash
git clone https://github.com/Emma42971/linxio-task.git
cd linxio-task
```

### 2. Créer le Fichier .env

```bash
cp env.example .env
nano .env
```

**Modifier** :
- Tous les `change_this_*` avec des secrets générés
- Les URLs avec votre domaine réel
- Les credentials SMTP si nécessaire

**Générer les secrets** :
```bash
openssl rand -base64 32  # Pour chaque secret
```

### 3. Créer le Réseau Proxy (si pas déjà fait)

```bash
docker network create proxy
```

### 4. Démarrer les Services

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. Vérifier les Logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### 6. Configurer NPM

Dans Nginx Proxy Manager :

1. **Créer un nouveau Proxy Host**
   - Domain Names: `tasks.example.com`
   - Forward Hostname/IP: `linxio-task-app`
   - Forward Port: `3000`
   - Forward Scheme: `http`
   - Websockets Support: ✅ Enabled

2. **SSL**
   - Request SSL Certificate: ✅
   - Force SSL: ✅
   - HTTP/2 Support: ✅

3. **Advanced** (optionnel)
   ```nginx
   # Custom Nginx Configuration
   client_max_body_size 10M;
   ```

### 7. Vérifier la Santé

```bash
# Vérifier les conteneurs
docker compose -f docker-compose.prod.yml ps

# Vérifier les healthchecks
docker inspect linxio-task-app --format '{{json .State.Health}}' | jq
```

## Commandes Utiles

### Redémarrer
```bash
docker compose -f docker-compose.prod.yml restart
```

### Mettre à jour
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Voir les logs
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Arrêter
```bash
docker compose -f docker-compose.prod.yml down
```

### Sauvegarder la base de données
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U linxio_task linxio_task > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### L'application ne démarre pas
```bash
docker compose -f docker-compose.prod.yml logs app
```

### Erreur de connexion à la base
```bash
docker compose -f docker-compose.prod.yml ps postgres
docker compose -f docker-compose.prod.yml logs postgres
```

### Erreur réseau proxy
```bash
docker network ls | grep proxy
docker network inspect proxy
```

---

**✅ Déploiement terminé !**

