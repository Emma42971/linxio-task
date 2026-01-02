# Skeleton Components - Guide d'utilisation

## 📋 Vue d'ensemble

Les composants Skeleton fournissent des placeholders animés pendant le chargement des données, améliorant l'expérience utilisateur en donnant un feedback visuel immédiat.

## ✨ Composants disponibles

### 1. TaskListSkeleton

Skeleton pour les listes de tâches (vue carte/liste, pas tableau).

```typescript
import { TaskListSkeleton } from '@/components/skeletons';

<TaskListSkeleton count={5} />
```

**Props :**
- `count` (number, default: 5) : Nombre de cartes skeleton à afficher

**Utilisation :**
```typescript
import { Suspense } from 'react';
import { TaskListSkeleton } from '@/components/skeletons';

<Suspense fallback={<TaskListSkeleton count={5} />}>
  <TaskListView tasks={tasks} />
</Suspense>
```

### 2. ProjectCardSkeleton

Skeleton pour les cartes de projets.

```typescript
import { ProjectCardSkeleton } from '@/components/skeletons';

<ProjectCardSkeleton count={6} variant="grid" />
```

**Props :**
- `count` (number, default: 6) : Nombre de cartes skeleton à afficher
- `variant` ('grid' | 'list', default: 'grid') : Layout des cartes

**Utilisation :**
```typescript
import { Suspense } from 'react';
import { ProjectCardSkeleton } from '@/components/skeletons';

<Suspense fallback={<ProjectCardSkeleton count={12} variant="grid" />}>
  <ProjectsGrid projects={projects} />
</Suspense>
```

### 3. DashboardSkeleton

Skeleton complet pour les pages dashboard.

```typescript
import { DashboardSkeleton } from '@/components/skeletons';

<DashboardSkeleton 
  showStats={true}
  showCharts={true}
  showRecentActivity={true}
/>
```

**Props :**
- `showStats` (boolean, default: true) : Afficher les cartes de statistiques
- `showCharts` (boolean, default: true) : Afficher les graphiques
- `showRecentActivity` (boolean, default: true) : Afficher l'activité récente

**Utilisation :**
```typescript
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons';

<Suspense fallback={<DashboardSkeleton />}>
  <OrganizationAnalytics organizationId={orgId} />
</Suspense>
```

### 4. TaskTableSkeleton

Skeleton pour les tableaux de tâches (déjà existant).

```typescript
import TaskTableSkeleton from '@/components/skeletons/TaskTableSkeleton';

<TaskTableSkeleton />
```

## 🔧 Intégration avec Suspense

### Exemple 1 : Page Dashboard

```typescript
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons';
import { OrganizationAnalytics } from '@/components/organizations/OrganizationAnalytics';

export default function DashboardPage() {
  const orgId = TokenManager.getCurrentOrgId();
  
  return (
    <div className="dashboard-container">
      <Suspense fallback={<DashboardSkeleton />}>
        <OrganizationAnalytics organizationId={orgId} />
      </Suspense>
    </div>
  );
}
```

### Exemple 2 : Liste de Projets

```typescript
import { Suspense } from 'react';
import { ProjectCardSkeleton } from '@/components/skeletons';
import { ProjectsContent } from '@/components/projects/ProjectsContent';

function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectCardSkeleton count={12} variant="grid" />}>
      <ProjectsContent {...props} />
    </Suspense>
  );
}
```

### Exemple 3 : Liste de Tâches

```typescript
import { Suspense } from 'react';
import { TaskListSkeleton } from '@/components/skeletons';
import { TaskListView } from '@/components/tasks/views/TaskListView';

function TasksPage() {
  return (
    <Suspense fallback={<TaskListSkeleton count={10} />}>
      <TaskListView tasks={tasks} />
    </Suspense>
  );
}
```

## 📝 Patterns d'utilisation

### Pattern 1 : Loading State Conditionnel

```typescript
function Component() {
  const { data, isLoading } = useQuery();
  
  if (isLoading) {
    return <TaskListSkeleton count={5} />;
  }
  
  return <TaskListView tasks={data} />;
}
```

### Pattern 2 : Suspense avec React Query

```typescript
import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskListSkeleton } from '@/components/skeletons';

function TasksList() {
  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    suspense: true, // Active le mode suspense
  });
  
  return <TaskListView tasks={data} />;
}

function TasksPage() {
  return (
    <Suspense fallback={<TaskListSkeleton count={10} />}>
      <TasksList />
    </Suspense>
  );
}
```

### Pattern 3 : Multiple Skeletons

```typescript
function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardSkeleton showStats={true} showCharts={false} />}>
        <StatsSection />
      </Suspense>
      
      <Suspense fallback={<DashboardSkeleton showStats={false} showCharts={true} />}>
        <ChartsSection />
      </Suspense>
    </div>
  );
}
```

## 🎨 Personnalisation

### Styles CSS

Les skeletons utilisent les variables CSS du thème :

```css
.skeleton-base {
  background: var(--muted);
  border-radius: 0.25rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

### Classes personnalisées

Vous pouvez ajouter des classes personnalisées :

```typescript
<TaskListSkeleton 
  count={5} 
  className="custom-skeleton-class"
/>
```

## 📊 Bonnes pratiques

1. **Utiliser le bon skeleton** : Choisissez le skeleton qui correspond à la structure de votre composant
2. **Count approprié** : Utilisez un nombre de skeletons qui correspond au nombre d'éléments attendus
3. **Suspense pour les données async** : Utilisez Suspense pour les composants qui chargent des données
4. **Loading states conditionnels** : Utilisez des skeletons pour les états de chargement conditionnels
5. **Cohérence** : Utilisez les mêmes skeletons pour les mêmes types de contenu

## 🚫 À éviter

- ❌ Utiliser un skeleton qui ne correspond pas à la structure du composant
- ❌ Afficher trop de skeletons (max 10-12)
- ❌ Oublier de gérer les états d'erreur
- ❌ Utiliser des skeletons pour des chargements très rapides (< 200ms)

## ✅ Checklist d'intégration

- [ ] Importer le skeleton approprié
- [ ] Envelopper le composant avec Suspense
- [ ] Définir le fallback avec le skeleton
- [ ] Ajuster le count selon le nombre d'éléments attendus
- [ ] Tester avec des connexions lentes
- [ ] Vérifier la cohérence visuelle

## 📚 Références

- [React Suspense Documentation](https://react.dev/reference/react/Suspense)
- [Skeleton UI Best Practices](https://www.nngroup.com/articles/skeleton-screens/)

