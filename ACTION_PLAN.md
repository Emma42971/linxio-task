# 📋 Plan d'Action - Corrections Hostinger Ready

## ✅ Fichiers Créés

1. ✅ `Dockerfile.prod` - Build reproductible avec npm ci
2. ✅ `docker-compose.prod.yml` - Configuré pour NPM proxy
3. ✅ `DEPLOYMENT_QUICKSTART.md` - Guide de déploiement
4. ✅ `.github/workflows/ci.yml` - CI GitHub Actions
5. ✅ `CORRECTIONS_EXACTES.md` - Documentation complète

## 🔧 Actions à Faire Maintenant

### 1. Fix @nestjs/throttler (5 minutes)

**Dans `backend/package.json`** :

Chercher :
```json
"@nestjs/throttler": "^5.1.1"
```

Remplacer par :
```json
"@nestjs/throttler": "^6.0.0"
```

**Commandes** :
```bash
cd backend
npm install @nestjs/throttler@^6.0.0
cd ..
npm install
```

**Vérifier** :
```bash
npm ls @nestjs/throttler
# Doit afficher 6.x.x
```

---

### 2. Standardiser les Noms (10 minutes)

**Recherche globale dans Cursor** :

1. ✅ Rechercher : `@taskosaur` → `@linxio-task` (DÉJÀ FAIT)
   - Tous les fichiers ont été corrigés

2. ✅ Rechercher : `/app/taskosaur` → `/app/linxio-task` (DÉJÀ FAIT)
   - Tous les Dockerfiles ont été corrigés

3. ✅ Rechercher : `taskosaur` → `linxio-task` (DÉJÀ FAIT)
   - Tous les noms ont été standardisés

**Fichiers à vérifier manuellement** :
- `package.json` (racine)
- `backend/package.json`
- `frontend/package.json`
- `package-lock.json` (régénérer après)

**Régénérer package-lock.json** :
```bash
rm package-lock.json
npm install
```

---

### 3. Mettre à jour env.example

Le fichier `env.example` doit être mis à jour avec les URLs de production. Voir `CORRECTIONS_EXACTES.md` section 5 pour le contenu exact.

**Points clés** :
- URLs : `https://tasks.example.com` (remplacer par votre domaine)
- Ajouter : `TRUST_PROXY=true`
- Garder les placeholders pour secrets

---

### 4. Vérifier docker/entrypoint.sh

✅ Le chemin est déjà `/app/linxio-task` dans tous les fichiers Docker.

---

### 5. Test Local (optionnel mais recommandé)

```bash
# Valider la syntaxe
docker compose -f docker-compose.prod.yml config

# Si erreur, corriger et réessayer
```

---

### 6. Commit et Push

```bash
git add .
git commit -m "fix: Hostinger-ready - throttler v6, docker prod, NPM proxy, names standardization"
git push origin main
```

---

### 7. Déploiement sur Hostinger

Suivre `DEPLOYMENT_QUICKSTART.md`

---

## ⚠️ Points d'Attention

1. **package-lock.json** : Doit être régénéré après changement de throttler et noms
2. **Réseau proxy** : Doit exister avant `docker compose up`
3. **Secrets** : Tous les `change_this_*` doivent être remplacés dans `.env`
4. **URLs** : Remplacer `tasks.example.com` par votre vrai domaine

---

## ✅ Checklist Finale

- [ ] @nestjs/throttler mis à jour vers 6.x
- [ ] package-lock.json régénéré
- [x] Tous les noms standardisés (taskosaur → linxio-task) ✅
- [ ] env.example mis à jour avec URLs prod
- [ ] docker-compose.prod.yml vérifié
- [ ] Dockerfile.prod vérifié
- [ ] docker/entrypoint.sh vérifié
- [ ] Test local réussi (docker compose config)
- [ ] Commit et push effectués
- [ ] Réseau proxy créé sur serveur
- [ ] Déploiement réussi

---

**🎯 Objectif : Repo clean, reproductible, et Hostinger-ready !**

