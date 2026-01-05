# Gantt View avec gantt-task-react

## Installation

Pour utiliser la vue Gantt améliorée avec `gantt-task-react`, installez le package :

```bash
cd frontend
npm install gantt-task-react
```

## Fonctionnalités

La vue Gantt améliorée inclut :

- **Timeline visuelle** : Affichage des tâches sur une timeline avec dates de début et fin
- **Dépendances** : Affichage des relations de dépendance entre tâches
- **Drag & Drop** : Modification des dates par glisser-déposer
- **Export PDF** : Export du diagramme de Gantt en PDF
- **Zoom** : Zoom in/out pour différentes vues (jour, semaine, mois)

## Utilisation

Le composant `GanttView` remplace ou améliore `TaskGanttView.tsx` existant :

```tsx
import GanttView from '@/components/views/GanttView';

<GanttView
  tasks={tasks}
  onTaskUpdate={(taskId, updates) => {
    // Mettre à jour la tâche
  }}
  onTaskDateChange={(taskId, startDate, endDate) => {
    // Mettre à jour les dates
  }}
/>
```

## Intégration avec l'API

Le composant doit :
1. Charger les tâches avec leurs dépendances
2. Envoyer les mises à jour de dates via l'API
3. Afficher les dépendances entre tâches
4. Permettre l'export PDF

## Notes

- Le package `gantt-task-react` doit être installé avant d'utiliser ce composant
- Les dépendances entre tâches sont gérées via le modèle `TaskDependency` dans Prisma
- Les dates peuvent être modifiées par drag & drop et sont synchronisées avec le backend


