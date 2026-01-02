# Command Palette - Documentation

## 📋 Vue d'ensemble

La **Command Palette** est une interface de recherche globale et d'actions rapides accessible via le raccourci clavier `Cmd+K` (Mac) ou `Ctrl+K` (Windows/Linux). Elle permet de :

- 🔍 Rechercher globalement (tasks, projects, users, workspaces)
- ⚡ Exécuter des actions rapides (create task, create project, etc.)
- 🧭 Naviguer rapidement vers différentes sections
- ⌨️ Utiliser des raccourcis clavier pour une productivité maximale

## ✨ Fonctionnalités

### 1. Recherche Globale

La recherche globale permet de trouver rapidement :
- **Tasks** : Recherche par titre, description, ID
- **Projects** : Recherche par nom, slug
- **Workspaces** : Recherche par nom
- **Users** : Recherche par nom, email
- **Sprints** : Recherche par nom, ID

**Utilisation** :
1. Appuyez sur `Cmd+K` / `Ctrl+K`
2. Tapez au moins 2 caractères pour lancer la recherche
3. Les résultats apparaissent en temps réel
4. Sélectionnez un résultat avec `Enter` ou cliquez dessus

### 2. Actions Rapides

Actions disponibles :
- **Create Task** : Créer une nouvelle tâche
- **Create Project** : Créer un nouveau projet
- **Create Workspace** : Créer un nouvel espace de travail
- **Go to Dashboard** : Naviguer vers le tableau de bord
- **Go to Settings** : Ouvrir les paramètres
- **Open AI Chat** : Ouvrir le chat IA

**Utilisation** :
1. Appuyez sur `Cmd+K` / `Ctrl+K`
2. Tapez le nom de l'action (ex: "create task")
3. Sélectionnez l'action avec `Enter`

### 3. Navigation Rapide

La palette affiche automatiquement :
- **Recent Workspaces** : Espaces de travail récents
- **Recent Projects** : Projets récents
- **Current Context** : Workspace et projet actuels

**Utilisation** :
1. Appuyez sur `Cmd+K` / `Ctrl+K`
2. Les éléments récents apparaissent automatiquement
3. Sélectionnez un élément pour y naviguer

## ⌨️ Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Cmd+K` / `Ctrl+K` | Ouvrir/Fermer la palette |
| `Esc` | Fermer la palette |
| `↑` / `↓` | Naviguer dans les résultats |
| `Enter` | Sélectionner un élément |
| `Tab` | Naviguer entre les groupes |

## 🎯 Exemples d'utilisation

### Rechercher une tâche

1. Appuyez sur `Cmd+K`
2. Tapez "authentication" (ou le nom de la tâche)
3. Les tâches correspondantes apparaissent
4. Sélectionnez la tâche souhaitée

### Créer une nouvelle tâche

1. Appuyez sur `Cmd+K`
2. Tapez "create task"
3. Sélectionnez "Create Task"
4. Le formulaire de création s'ouvre

### Naviguer vers un projet

1. Appuyez sur `Cmd+K`
2. Tapez le nom du projet
3. Sélectionnez le projet dans les résultats
4. Vous êtes redirigé vers le projet

## 🔧 Intégration

Le composant `CommandPalette` est automatiquement intégré dans le `Header` et disponible globalement dans l'application.

### Fichiers

- **Composant** : `frontend/src/components/CommandPalette.tsx`
- **Intégration** : `frontend/src/components/layout/Header.tsx`
- **UI Components** : `frontend/src/components/ui/command.tsx`

### Dépendances

- `cmdk` : Bibliothèque de command palette (déjà installée)
- `lucide-react` : Icônes
- `next/router` : Navigation
- Contextes : `useOrganization`, `useWorkspaceContext`, `useProjectContext`

## 🎨 Personnalisation

### Ajouter une nouvelle action rapide

Modifiez le tableau `quickActions` dans `CommandPalette.tsx` :

```typescript
{
  id: 'my-action',
  label: 'My Action',
  description: 'Description de l\'action',
  icon: <MyIcon className="h-4 w-4" />,
  keywords: ['action', 'my', 'keywords'],
  action: () => {
    // Votre logique ici
    router.push('/my-route');
    setOpen(false);
  },
}
```

### Personnaliser les résultats de recherche

Les résultats de recherche sont formatés dans la fonction `handleResultSelect`. Vous pouvez personnaliser la navigation pour chaque type de résultat.

## 📊 Performance

- **Debounce** : La recherche est debounced à 300ms pour éviter trop de requêtes
- **Limite** : Maximum 10 résultats par recherche
- **Cache** : Les résultats sont mis en cache par le contexte d'organisation

## 🐛 Dépannage

### La palette ne s'ouvre pas

1. Vérifiez que le composant est bien intégré dans le Header
2. Vérifiez que le raccourci clavier n'est pas intercepté par un autre composant
3. Vérifiez la console pour les erreurs

### La recherche ne fonctionne pas

1. Vérifiez que `currentOrganizationId` est défini
2. Vérifiez que `universalSearch` est disponible dans le contexte
3. Vérifiez la console pour les erreurs API

### Les actions ne fonctionnent pas

1. Vérifiez que les routes existent
2. Vérifiez que les contextes (workspace, project) sont disponibles si nécessaires
3. Vérifiez la console pour les erreurs

## 🚀 Améliorations futures

- [ ] Historique des recherches
- [ ] Suggestions intelligentes basées sur l'utilisation
- [ ] Raccourcis personnalisables
- [ ] Recherche dans le contenu des tâches (description, commentaires)
- [ ] Filtres avancés dans la recherche
- [ ] Mode sombre/clair adaptatif
- [ ] Support des commandes vocales

## 📚 Références

- [cmdk Documentation](https://cmdk.paco.me/)
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Lucide Icons](https://lucide.dev/)

