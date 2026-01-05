# 🔄 Guide de Migration - Taskosaur vers Linxio Task

Ce guide vous aide à migrer de Taskosaur vers Linxio Task.

## 📋 Changements Principaux

### Nom de l'application
- **Ancien** : Taskosaur
- **Nouveau** : Linxio Task

### Configuration Docker
- Nouveau `Dockerfile` optimisé
- Nouveau `docker-compose.yml` avec installation automatique
- Script d'installation automatique : `scripts/setup-docker.sh`

### Variables d'environnement
- Noms de variables inchangés
- Nouveaux noms par défaut pour les bases de données :
  - `POSTGRES_USER`: `linxio_task` (au lieu de `taskosaur`)
  - `POSTGRES_DB`: `linxio_task` (au lieu de `taskosaur`)

## 🔧 Étapes de Migration

### 1. Sauvegarder vos données

```bash
# Backup de la base de données
docker-compose exec postgres pg_dump -U taskosaur taskosaur > backup.sql

# Backup des fichiers uploadés
tar -czf uploads_backup.tar.gz ./uploads
```

### 2. Mettre à jour le code

```bash
# Récupérer les dernières modifications
git pull origin main

# Vérifier les changements
git status
```

### 3. Mettre à jour la configuration

```bash
# Copier le nouveau fichier d'exemple
cp env.example .env.new

# Comparer avec votre .env actuel
diff .env .env.new

# Mettre à jour votre .env avec les nouvelles valeurs
# Note: Les noms de variables sont identiques, seuls les noms par défaut ont changé
```

### 4. Mettre à jour Docker

```bash
# Arrêter l'ancienne installation
docker-compose down

# Reconstruire les images
docker-compose build --no-cache

# Redémarrer
docker-compose up -d
```

### 5. Migrer la base de données

Si vous utilisez les nouveaux noms par défaut :

```bash
# Option 1: Renommer la base de données
docker-compose exec postgres psql -U postgres -c "ALTER DATABASE taskosaur RENAME TO linxio_task;"
docker-compose exec postgres psql -U postgres -c "ALTER USER taskosaur RENAME TO linxio_task;"

# Option 2: Restaurer dans la nouvelle base
docker-compose exec -T postgres psql -U linxio_task linxio_task < backup.sql
```

### 6. Vérifier l'application

```bash
# Vérifier les logs
docker-compose logs -f app

# Vérifier le health check
curl http://localhost:3000/api/health

# Accéder à l'application
open http://localhost:3000
```

## ⚠️ Points d'Attention

### Noms de conteneurs Docker

Les noms de conteneurs ont changé :
- `taskosaur-postgres` → `linxio-task-postgres`
- `taskosaur-redis` → `linxio-task-redis`
- `taskosaur-app` → `linxio-task-app`

### Volumes Docker

Les volumes utilisent toujours les mêmes noms :
- `postgres_data`
- `redis_data`
- `app_uploads`
- `app_logs`

Vos données sont préservées.

### Configuration Nginx

Si vous utilisez Nginx, mettez à jour la configuration :

```nginx
# Ancien
server_name taskosaur.example.com;

# Nouveau
server_name linxio-task.example.com;
```

## 🔄 Migration Automatique

Un script de migration automatique est disponible :

```bash
chmod +x scripts/migrate-to-linxio.sh
./scripts/migrate-to-linxio.sh
```

Ce script :
1. ✅ Sauvegarde automatiquement vos données
2. ✅ Met à jour la configuration
3. ✅ Migre la base de données
4. ✅ Redémarre les services

## ❓ Questions Fréquentes

### Mes données seront-elles perdues ?

Non, vos données sont préservées dans les volumes Docker. Assurez-vous de faire un backup avant la migration.

### Dois-je changer mes variables d'environnement ?

Non, les noms de variables sont identiques. Seuls les noms par défaut des bases de données ont changé.

### Puis-je utiliser les anciens noms de base de données ?

Oui, vous pouvez garder `taskosaur` comme nom de base de données en configurant `.env` :

```env
POSTGRES_USER=taskosaur
POSTGRES_DB=taskosaur
```

### Que faire en cas de problème ?

1. Restaurez le backup : `docker-compose exec -T postgres psql -U linxio_task linxio_task < backup.sql`
2. Vérifiez les logs : `docker-compose logs app`
3. Ouvrez une issue sur GitHub

## 📞 Support

Pour toute question sur la migration :
- Ouvrez une issue sur GitHub
- Consultez la documentation
- Contactez le support

---

**Note** : Cette migration est rétrocompatible. Vous pouvez continuer à utiliser les anciens noms si vous le souhaitez.


