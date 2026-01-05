# 🔄 Régénération du package-lock.json

## ⚠️ Problème Identifié

Le `package-lock.json` contient encore des références à "taskosaur" alors que les `package.json` ont été renommés en "linxio-task". Cela peut causer des problèmes avec `npm install`.

## ✅ Solution

### Option 1: Régénérer localement (Recommandé)

```bash
# Supprimer l'ancien package-lock.json
rm package-lock.json

# Régénérer avec npm install
npm install

# Vérifier les changements
git diff package-lock.json

# Commit et push
git add package-lock.json
git commit -m "chore: regenerate package-lock.json after renaming to linxio-task"
git push origin main
```

### Option 2: Le Dockerfile le régénère automatiquement

Le Dockerfile a été modifié pour :
- Essayer d'utiliser `package-lock.json` s'il existe
- Le régénérer automatiquement s'il y a des problèmes
- Utiliser `--legacy-peer-deps` pour gérer les conflits

## 📋 Commandes pour Régénérer

```bash
# 1. Supprimer l'ancien
rm package-lock.json

# 2. Installer pour régénérer
npm install

# 3. Vérifier
git status
git diff package-lock.json

# 4. Commit
git add package-lock.json
git commit -m "chore: regenerate package-lock.json"
git push
```

## 🔍 Vérification

Après régénération, vérifiez que :
- ✅ Le nom dans package-lock.json est `@linxio-task/platform`
- ✅ Les workspaces pointent vers `@linxio-task/backend` et `@linxio-task/frontend`
- ✅ Plus de références à "taskosaur"

---

**Note** : La régénération peut prendre quelques minutes et modifier beaucoup de lignes dans package-lock.json. C'est normal.


