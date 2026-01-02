# Exemples de Migration vers les Toasts

Ce document montre comment remplacer les patterns existants par des toasts.

## Exemple 1 : API Calls (taskApi.ts)

### Avant

```typescript
createTask: async (taskData: CreateTaskRequest): Promise<Task> => {
  try {
    const response = await api.post<Task>("/tasks", taskData);
    return response.data;
  } catch (error) {
    console.error("Create task error:", error);
    throw error;
  }
},
```

### Après

```typescript
import { toastLogError } from '@/lib/toast';

createTask: async (taskData: CreateTaskRequest): Promise<Task> => {
  try {
    const response = await api.post<Task>("/tasks", taskData);
    return response.data;
  } catch (error) {
    toastLogError("Create task error", error);
    throw error;
  }
},
```

## Exemple 2 : Composants avec try/catch (NewTaskModal.tsx)

### Avant

```typescript
try {
  await createTask(taskData);
  toast.success("Task created successfully!");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Failed to create task";
  setError(errorMessage);
  toast.error(errorMessage);
  console.error("Failed to create task:", error);
}
```

### Après

```typescript
import { toastPromise, toastSuccess, toastError } from '@/lib/toast';

// Option 1 : Utiliser toastPromise (recommandé)
try {
  await toastPromise(
    createTask(taskData),
    {
      loading: 'Création de la tâche...',
      success: 'Tâche créée avec succès',
      error: (err) => err.message || 'Erreur lors de la création',
    }
  );
  handleClose();
} catch (error) {
  // L'erreur est déjà gérée par toastPromise
  setError(error instanceof Error ? error.message : "Failed to create task");
}

// Option 2 : Gestion manuelle
try {
  await createTask(taskData);
  toastSuccess("Task created successfully!");
  handleClose();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Failed to create task";
  setError(errorMessage);
  toastError("Erreur", errorMessage);
}
```

## Exemple 3 : Remplacement de alert()

### Avant

```typescript
if (!isValid) {
  alert('Veuillez remplir tous les champs');
  return;
}
```

### Après

```typescript
import { toastWarning } from '@/lib/toast';

if (!isValid) {
  toastWarning('Validation', 'Veuillez remplir tous les champs');
  return;
}
```

## Exemple 4 : Opérations avec feedback utilisateur

### Avant

```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ?')) {
    return;
  }
  
  try {
    await api.delete(id);
    alert('Supprimé avec succès');
    router.refresh();
  } catch (error) {
    alert('Erreur lors de la suppression');
    console.error(error);
  }
};
```

### Après

```typescript
import { toastPromise, toastWarning } from '@/lib/toast';

const handleDelete = async (id: string) => {
  toastWarning('Suppression', 'Cette action est irréversible');
  
  await toastPromise(
    api.delete(id),
    {
      loading: 'Suppression en cours...',
      success: 'Supprimé avec succès',
      error: (err) => `Erreur: ${err.message}`,
    }
  );
  
  router.refresh();
};
```

## Exemple 5 : Logs de développement

### Avant

```typescript
console.log('User data:', userData);
console.warn('Deprecated API used');
console.error('API Error:', error);
```

### Après

```typescript
import { toastLog, toastLogWarn, toastLogError } from '@/lib/toast';

// En développement seulement
toastLog('User data', userData);
toastLogWarn('Deprecated API used');
toastLogError('API Error', error);
```

## Exemple 6 : Validation de formulaire

### Avant

```typescript
const handleSubmit = async (data: FormData) => {
  if (!data.title) {
    alert('Le titre est requis');
    return;
  }
  
  if (!data.projectId) {
    alert('Veuillez sélectionner un projet');
    return;
  }
  
  try {
    await createTask(data);
    alert('Tâche créée !');
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
};
```

### Après

```typescript
import { toastWarning, toastPromise } from '@/lib/toast';

const handleSubmit = async (data: FormData) => {
  if (!data.title) {
    toastWarning('Validation', 'Le titre est requis');
    return;
  }
  
  if (!data.projectId) {
    toastWarning('Validation', 'Veuillez sélectionner un projet');
    return;
  }
  
  await toastPromise(
    createTask(data),
    {
      loading: 'Création...',
      success: 'Tâche créée !',
      error: (err) => `Erreur: ${err.message}`,
    }
  );
};
```

## Exemple 7 : Opérations en lot

### Avant

```typescript
const handleBulkDelete = async (ids: string[]) => {
  try {
    for (const id of ids) {
      await api.delete(id);
    }
    alert(`${ids.length} éléments supprimés`);
  } catch (error) {
    alert('Erreur lors de la suppression');
    console.error(error);
  }
};
```

### Après

```typescript
import { toastPromise } from '@/lib/toast';

const handleBulkDelete = async (ids: string[]) => {
  await toastPromise(
    Promise.all(ids.map(id => api.delete(id))),
    {
      loading: `Suppression de ${ids.length} éléments...`,
      success: `${ids.length} éléments supprimés`,
      error: (err) => `Erreur: ${err.message}`,
    }
  );
};
```

## Checklist de migration

Pour chaque fichier à migrer :

1. ✅ Importer les fonctions toast nécessaires
2. ✅ Remplacer `alert()` par `toastWarning()` ou `toastInfo()`
3. ✅ Remplacer `console.error()` par `toastError()` ou `toastLogError()`
4. ✅ Remplacer `console.log()` par `toastInfo()` ou `toastLog()` (dev seulement)
5. ✅ Utiliser `toastPromise()` pour les opérations async
6. ✅ Tester tous les cas d'erreur
7. ✅ Vérifier que les messages sont clairs

## Fichiers prioritaires à migrer

1. **API files** (`utils/api/*.ts`) - Remplacer tous les `console.error`
2. **Modal components** - Remplacer les `alert()` et `console.error`
3. **Form handlers** - Utiliser `toastPromise` pour les soumissions
4. **Error boundaries** - Utiliser `toastError` pour les erreurs globales

