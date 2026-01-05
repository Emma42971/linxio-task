# Toast Notifications - Guide d'utilisation

## 📋 Vue d'ensemble

Le système de notifications toast utilise **Sonner** pour afficher des notifications non-intrusives à l'utilisateur. Tous les `alert()`, `console.log()`, `console.error()`, etc. doivent être remplacés par des toasts.

## 🚀 Installation

`sonner` est déjà installé dans le projet. Le composant `Notifications` est configuré globalement dans `_app.tsx`.

## ✨ Utilisation

### Import

```typescript
import { toastSuccess, toastError, toastPromise, toastInfo, toastWarning } from '@/lib/toast';
```

### Types de toasts

#### 1. Toast de succès

```typescript
import { toastSuccess } from '@/lib/toast';

// Simple
toastSuccess('Tâche créée avec succès');

// Avec description
toastSuccess('Tâche créée', 'La tâche a été ajoutée au projet');
```

#### 2. Toast d'erreur

```typescript
import { toastError } from '@/lib/toast';

// Simple
toastError('Erreur lors de la création');

// Avec description
toastError('Erreur', error.message);
```

#### 3. Toast d'information

```typescript
import { toastInfo } from '@/lib/toast';

toastInfo('Information', 'Votre profil a été mis à jour');
```

#### 4. Toast d'avertissement

```typescript
import { toastWarning } from '@/lib/toast';

toastWarning('Attention', 'Cette action est irréversible');
```

#### 5. Toast de chargement

```typescript
import { toastLoading } from '@/lib/toast';

const toastId = toastLoading('Chargement...');

// Mettre à jour ou fermer
toast.dismiss(toastId);
```

#### 6. Toast avec Promise

```typescript
import { toastPromise } from '@/lib/toast';

// Pour les opérations asynchrones
const createTask = async (data) => {
  return await taskApi.createTask(data);
};

toastPromise(
  createTask(taskData),
  {
    loading: 'Création de la tâche...',
    success: 'Tâche créée avec succès',
    error: (err) => `Erreur: ${err.message}`,
  }
);
```

## 🔄 Remplacement des patterns existants

### Remplacer `alert()`

**Avant :**
```typescript
alert('Tâche créée avec succès');
```

**Après :**
```typescript
import { toastSuccess } from '@/lib/toast';

toastSuccess('Tâche créée avec succès');
```

### Remplacer `console.error()`

**Avant :**
```typescript
try {
  await createTask(data);
} catch (error) {
  console.error('Erreur:', error);
}
```

**Après :**
```typescript
import { toastError, toastLogError } from '@/lib/toast';

try {
  await createTask(data);
} catch (error) {
  toastLogError('Erreur lors de la création', error);
  // ou
  toastError('Erreur', error.message);
}
```

### Remplacer `console.log()`

**Avant :**
```typescript
console.log('Tâche créée:', task);
```

**Après :**
```typescript
import { toastInfo, toastLog } from '@/lib/toast';

// En développement seulement
toastLog('Tâche créée', task);

// Ou pour l'utilisateur
toastInfo('Tâche créée', task.title);
```

### Remplacer les try/catch avec messages

**Avant :**
```typescript
try {
  const result = await api.create(data);
  console.log('Succès:', result);
} catch (error) {
  console.error('Erreur:', error);
  alert('Une erreur est survenue');
}
```

**Après :**
```typescript
import { toastPromise } from '@/lib/toast';

toastPromise(
  api.create(data),
  {
    loading: 'Création en cours...',
    success: 'Créé avec succès',
    error: (err) => `Erreur: ${err.message}`,
  }
);
```

## 📝 Exemples concrets

### Exemple 1 : Création de tâche

```typescript
import { toastPromise, toastSuccess } from '@/lib/toast';
import { taskApi } from '@/utils/api/taskApi';

const handleCreateTask = async (taskData) => {
  try {
    const task = await taskApi.createTask(taskData);
    toastSuccess('Tâche créée', `"${task.title}" a été ajoutée`);
    return task;
  } catch (error) {
    toastError('Erreur', error.message || 'Impossible de créer la tâche');
    throw error;
  }
};

// Ou avec toastPromise
const handleCreateTask = async (taskData) => {
  return toastPromise(
    taskApi.createTask(taskData),
    {
      loading: 'Création de la tâche...',
      success: (task) => `Tâche "${task.title}" créée`,
      error: (err) => `Erreur: ${err.message}`,
    }
  );
};
```

### Exemple 2 : Suppression avec confirmation

```typescript
import { toastPromise, toastWarning } from '@/lib/toast';

const handleDelete = async (id) => {
  // Afficher un avertissement
  toastWarning('Suppression', 'Cette action est irréversible');
  
  // Puis supprimer
  return toastPromise(
    api.delete(id),
    {
      loading: 'Suppression...',
      success: 'Supprimé avec succès',
      error: 'Erreur lors de la suppression',
    }
  );
};
```

### Exemple 3 : Mise à jour avec feedback

```typescript
import { toastPromise } from '@/lib/toast';

const handleUpdate = async (id, data) => {
  return toastPromise(
    api.update(id, data),
    {
      loading: 'Mise à jour...',
      success: 'Mis à jour avec succès',
      error: (err) => `Erreur: ${err.message}`,
    }
  );
};
```

## 🎨 Personnalisation

### Durée personnalisée

```typescript
import { toast } from 'sonner';

toast.success('Message', {
  duration: 10000, // 10 secondes
});
```

### Position personnalisée

Le composant `Notifications` est configuré avec `position="top-right"`. Pour changer :

```typescript
// Dans Notifications.tsx
<SonnerToaster position="bottom-right" />
```

### Style personnalisé

Les styles sont définis via CSS variables dans `Notifications.tsx`. Vous pouvez les personnaliser :

```typescript
style={{
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
}}
```

## 🔧 Fonctions utilitaires

### `toastDismiss(id)`

Fermer un toast spécifique :

```typescript
import { toastLoading, toastDismiss } from '@/lib/toast';

const id = toastLoading('Chargement...');
// ... opération
toastDismiss(id);
```

### `toastDismissAll()`

Fermer tous les toasts :

```typescript
import { toastDismissAll } from '@/lib/toast';

toastDismissAll();
```

### `toastAlert(message, type)`

Remplacement direct de `alert()` :

```typescript
import { toastAlert } from '@/lib/toast';

toastAlert('Message', 'success'); // ou 'error', 'warning', 'info'
```

## 📊 Bonnes pratiques

1. **Utilisez `toastPromise` pour les opérations async** : Plus propre et informatif
2. **Messages clairs et concis** : Maximum 1-2 lignes
3. **Descriptions utiles** : Ajoutez des détails dans la description si nécessaire
4. **Gérez les erreurs** : Toujours afficher un toast d'erreur en cas d'échec
5. **Évitez les toasts en développement** : Utilisez `toastLog` qui ne s'affiche qu'en dev

## 🚫 À éviter

- ❌ Trop de toasts simultanés
- ❌ Messages trop longs
- ❌ Toasts pour des actions non-critiques (ex: hover)
- ❌ Utiliser `alert()` ou `console.log()` pour l'utilisateur

## ✅ Checklist de migration

- [ ] Remplacer tous les `alert()` par des toasts
- [ ] Remplacer les `console.error()` par `toastError` ou `toastLogError`
- [ ] Remplacer les `console.log()` par `toastInfo` ou `toastLog` (dev seulement)
- [ ] Utiliser `toastPromise` pour les opérations async
- [ ] Tester tous les cas d'erreur
- [ ] Vérifier que les messages sont clairs et utiles

## 📚 Références

- [Sonner Documentation](https://sonner.emilkowal.ski/)
- [Fichier toast.ts](/frontend/src/lib/toast.ts)
- [Composant Notifications.tsx](/frontend/src/components/Notifications.tsx)


