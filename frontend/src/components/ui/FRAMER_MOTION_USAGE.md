# Framer Motion - Guide d'utilisation

## 📋 Vue d'ensemble

Framer Motion est déjà installé et configuré dans le projet. Ce guide explique comment utiliser les composants d'animation créés pour améliorer l'expérience utilisateur.

## ✨ Composants disponibles

### 1. AnimatedCard

Carte avec animations hover, tap et drag.

```typescript
import { AnimatedCard } from '@/components/ui/AnimatedCard';

<AnimatedCard
  hover={true}
  tap={true}
  variant="elevated"
  delay={0.1}
  className="p-6"
>
  <h3>Titre de la carte</h3>
  <p>Contenu de la carte</p>
</AnimatedCard>
```

**Props :**
- `hover` (boolean) : Active les effets hover
- `tap` (boolean) : Active les effets tap/click
- `drag` (boolean) : Active le drag & drop
- `variant` ('default' | 'elevated' | 'bordered') : Style de la carte
- `delay` (number) : Délai d'animation d'entrée
- `dragConstraints` : Contraintes de drag

### 2. AnimatedButton

Bouton avec micro-interactions.

```typescript
import { AnimatedButton } from '@/components/ui/AnimatedCard';

<AnimatedButton
  variant="primary"
  size="md"
  onClick={handleClick}
>
  Cliquer ici
</AnimatedButton>
```

**Props :**
- `variant` ('default' | 'primary' | 'ghost' | 'outline')
- `size` ('sm' | 'md' | 'lg')

### 3. DraggableCard

Carte draggable améliorée avec framer-motion.

```typescript
import { DraggableCard } from '@/components/ui/DraggableCard';

<DraggableCard
  id="task-123"
  onDragStart={() => console.log('Drag started')}
  onDragEnd={(info) => console.log('Drag ended', info)}
  dragDirection="both"
  snapBack={true}
>
  <div>Contenu draggable</div>
</DraggableCard>
```

**Props :**
- `id` (string) : Identifiant unique
- `onDragStart` : Callback au début du drag
- `onDragEnd` : Callback à la fin du drag
- `dragDirection` ('x' | 'y' | 'both') : Direction du drag
- `snapBack` (boolean) : Retour automatique à la position initiale

### 4. PageTransition

Transitions entre pages.

```typescript
import { PageTransition } from '@/components/ui/PageTransition';

<PageTransition variant="fade">
  <YourPageContent />
</PageTransition>
```

**Props :**
- `variant` ('fade' | 'slide' | 'scale' | 'slideUp')
- `className` : Classes CSS personnalisées

### 5. StaggerContainer & StaggerItem

Animations en cascade pour les listes.

```typescript
import { StaggerContainer, StaggerItem } from '@/components/ui/PageTransition';

<StaggerContainer staggerDelay={0.05}>
  {items.map((item, index) => (
    <StaggerItem key={item.id}>
      <ItemComponent item={item} />
    </StaggerItem>
  ))}
</StaggerContainer>
```

## 🔄 Transitions entre pages

### Utilisation dans _app.tsx

```typescript
import { PageTransition } from '@/components/ui/PageTransition';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PageTransition>
      <Component {...pageProps} />
    </PageTransition>
  );
}
```

### Variantes de transition

```typescript
// Fade (par défaut)
<PageTransition variant="fade">
  <Content />
</PageTransition>

// Slide
<PageTransition variant="slide">
  <Content />
</PageTransition>

// Scale
<PageTransition variant="scale">
  <Content />
</PageTransition>

// Slide Up
<PageTransition variant="slideUp">
  <Content />
</PageTransition>
```

## 🎯 Drag & Drop amélioré

### Utilisation avec useFramerDragAndDrop

```typescript
import { useFramerDragAndDrop } from '@/hooks/useFramerDragAndDrop';
import { DraggableCard } from '@/components/ui/DraggableCard';

function KanbanColumn() {
  const { dragState, handleDragStart, handleDragEnd, handleDrop } = useFramerDragAndDrop({
    onDragStart: (task, from) => {
      console.log('Drag started:', task, from);
    },
    onDrop: (task, from, to) => {
      console.log('Dropped:', task, from, to);
      // Mettre à jour le statut de la tâche
    },
  });

  return (
    <div>
      {tasks.map((task) => (
        <DraggableCard
          key={task.id}
          id={task.id}
          onDragStart={() => handleDragStart(task, currentStatusId)}
          onDragEnd={handleDragEnd}
        >
          <TaskContent task={task} />
        </DraggableCard>
      ))}
    </div>
  );
}
```

### DragDropZone

```typescript
import { DragDropZone } from '@/components/ui/DraggableCard';

<DragDropZone
  onDrop={(item) => {
    console.log('Item dropped:', item);
    // Traiter le drop
  }}
  isActive={dragState.isDragging}
>
  <div>Zone de drop</div>
</DragDropZone>
```

## 🎨 Micro-interactions

### Sur les cartes

```typescript
import { AnimatedCard } from '@/components/ui/AnimatedCard';

<AnimatedCard
  hover={true}
  tap={true}
  variant="elevated"
>
  <CardContent>
    <h3>Titre</h3>
    <p>Description</p>
  </CardContent>
</AnimatedCard>
```

### Sur les boutons

```typescript
import { AnimatedButton } from '@/components/ui/AnimatedCard';

<AnimatedButton
  variant="primary"
  size="lg"
  onClick={handleClick}
>
  Action
</AnimatedButton>
```

### Sur les listes

```typescript
import { AnimatedListItem } from '@/components/ui/AnimatedCard';

{items.map((item, index) => (
  <AnimatedListItem key={item.id} index={index}>
    <ItemComponent item={item} />
  </AnimatedListItem>
))}
```

## 📝 Exemples concrets

### Exemple 1 : Liste de projets avec animations

```typescript
import { StaggerContainer, StaggerItem } from '@/components/ui/PageTransition';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

function ProjectsList({ projects }) {
  return (
    <StaggerContainer staggerDelay={0.05}>
      {projects.map((project) => (
        <StaggerItem key={project.id}>
          <AnimatedCard
            hover={true}
            tap={true}
            variant="elevated"
            className="p-6"
          >
            <h3>{project.name}</h3>
            <p>{project.description}</p>
          </AnimatedCard>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
```

### Exemple 2 : Kanban avec drag & drop amélioré

```typescript
import { useFramerDragAndDrop } from '@/hooks/useFramerDragAndDrop';
import { DraggableCard, DragDropZone } from '@/components/ui/DraggableCard';

function KanbanBoard({ tasks, statuses }) {
  const { dragState, handleDragStart, handleDragEnd, handleDrop } = useFramerDragAndDrop({
    onDrop: async (task, from, to) => {
      await updateTaskStatus(task.id, to);
    },
  });

  return (
    <div className="flex gap-4">
      {statuses.map((status) => (
        <DragDropZone
          key={status.id}
          isActive={dragState.draggedTo === status.id}
          onDrop={() => handleDrop(status.id)}
          className="flex-1 p-4"
        >
          <h3>{status.name}</h3>
          {tasks
            .filter((t) => t.statusId === status.id)
            .map((task) => (
              <DraggableCard
                key={task.id}
                id={task.id}
                onDragStart={() => handleDragStart(task, task.statusId)}
                onDragEnd={handleDragEnd}
              >
                <TaskCard task={task} />
              </DraggableCard>
            ))}
        </DragDropZone>
      ))}
    </div>
  );
}
```

### Exemple 3 : Page avec transition

```typescript
import { PageTransition } from '@/components/ui/PageTransition';

export default function TasksPage() {
  return (
    <PageTransition variant="slideUp">
      <div className="p-6">
        <h1>Mes Tâches</h1>
        {/* Contenu de la page */}
      </div>
    </PageTransition>
  );
}
```

## 🎨 Personnalisation

### Variantes de cartes

```typescript
// Default
<AnimatedCard variant="default">...</AnimatedCard>

// Elevated (avec ombre)
<AnimatedCard variant="elevated">...</AnimatedCard>

// Bordered (bordure épaisse)
<AnimatedCard variant="bordered">...</AnimatedCard>
```

### Durées d'animation

Les animations utilisent des durées par défaut optimisées :
- Entrée : 0.3s
- Sortie : 0.2s
- Hover : 0.2s
- Tap : 0.1s

Vous pouvez personnaliser via les props `transition` de framer-motion.

## 📊 Bonnes pratiques

1. **Utilisez les animations avec modération** : Trop d'animations peuvent distraire
2. **Cohérence** : Utilisez les mêmes variantes pour les mêmes types d'éléments
3. **Performance** : Les animations sont optimisées mais évitez les animations complexes sur de grandes listes
4. **Accessibilité** : Respectez `prefers-reduced-motion` si nécessaire
5. **Feedback visuel** : Les animations doivent donner un feedback clair à l'utilisateur

## 🚫 À éviter

- ❌ Animer trop d'éléments simultanément
- ❌ Utiliser des animations trop longues (> 0.5s)
- ❌ Animer des éléments qui changent fréquemment
- ❌ Oublier de gérer les états de chargement

## ✅ Checklist d'intégration

- [ ] Importer les composants nécessaires
- [ ] Envelopper les pages avec PageTransition
- [ ] Remplacer les cartes statiques par AnimatedCard
- [ ] Utiliser DraggableCard pour le drag & drop
- [ ] Ajouter des micro-interactions sur les boutons
- [ ] Tester les animations sur différents appareils
- [ ] Vérifier les performances

## 📚 Références

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [AnimatedCard.tsx](/frontend/src/components/ui/AnimatedCard.tsx)
- [DraggableCard.tsx](/frontend/src/components/ui/DraggableCard.tsx)
- [PageTransition.tsx](/frontend/src/components/ui/PageTransition.tsx)
- [useFramerDragAndDrop.ts](/frontend/src/hooks/useFramerDragAndDrop.ts)


