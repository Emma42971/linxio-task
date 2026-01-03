# Notes sur les Index Ajoutés

## ✅ Index Ajoutés

### Task
- `@@index([statusId])` - Pour les requêtes filtrant par statut
- `@@index([projectId, statusId])` - Index composite pour les requêtes filtrant par projet et statut (très fréquent)

### Project
- `@@index([workspaceId])` - Pour les requêtes filtrant par workspace

**Note** : Project n'a pas de champ `organizationId` direct. Les projets sont liés aux organisations via `workspaceId` → `Workspace.organizationId`. Un index a été ajouté sur `Workspace.organizationId` pour améliorer les requêtes indirectes.

### User
- `@@index([email])` - Email est déjà unique, mais l'index améliore les performances des recherches
- `@@index([defaultOrganizationId])` - Pour les requêtes filtrant par organisation par défaut

**Note** : User n'a pas de champ `organizationId` direct. Les utilisateurs sont liés aux organisations via `OrganizationMember`. L'index sur `defaultOrganizationId` permet de filtrer efficacement les utilisateurs par leur organisation par défaut.

### Workspace
- `@@index([organizationId])` - Ajouté pour améliorer les requêtes filtrant les workspaces par organisation (et indirectement les projets)

## ⚠️ Index Non Ajoutés (Explications)

### Task - `@@index([assigneeId])`
**Raison** : Les assignees sont gérés via une relation many-to-many (`assignees User[] @relation("TaskAssignees")`). Prisma crée automatiquement une table de jointure implicite `_TaskAssignees` pour cette relation.

**Solution** : Pour créer un index sur les assignees, vous avez deux options :

1. **Option 1** : Créer une table de jointure explicite dans le schéma Prisma :
```prisma
model TaskAssignee {
  taskId   String @map("task_id") @db.Uuid
  userId   String @map("user_id") @db.Uuid
  task     Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([taskId, userId])
  @@index([userId])  // Index pour rechercher les tâches assignées à un utilisateur
  @@map("task_assignees")
}
```

2. **Option 2** : Créer une migration SQL manuelle pour ajouter l'index sur la table implicite :
```sql
CREATE INDEX "_TaskAssignees_B_index" ON "_TaskAssignees"("B");
-- où "B" est la colonne userId dans la table de jointure
```

### Project - `@@index([organizationId])`
**Raison** : Le modèle `Project` n'a pas de champ `organizationId` direct. Les projets sont liés aux organisations via `workspaceId` → `Workspace.organizationId`.

**Solution** : L'index sur `workspaceId` est déjà ajouté, ce qui permet de filtrer efficacement les projets par workspace. Pour filtrer par organisation, vous pouvez :
- Utiliser une jointure avec Workspace
- Créer un index composite sur Workspace si nécessaire

## 📊 Impact des Index

### Performance Attendue

1. **Task - statusId** : Améliore les requêtes comme :
   ```typescript
   await prisma.task.findMany({
     where: { statusId: 'xxx' }
   });
   ```

2. **Task - projectId, statusId** : Améliore les requêtes comme :
   ```typescript
   await prisma.task.findMany({
     where: { 
       projectId: 'xxx',
       statusId: 'yyy'
     }
   });
   ```

3. **Project - workspaceId** : Améliore les requêtes comme :
   ```typescript
   await prisma.project.findMany({
     where: { workspaceId: 'xxx' }
   });
   ```

4. **User - email** : Améliore les recherches par email (déjà optimisé avec unique, mais l'index peut aider dans certains cas)

5. **User - defaultOrganizationId** : Améliore les requêtes comme :
   ```typescript
   await prisma.user.findMany({
     where: { defaultOrganizationId: 'xxx' }
   });
   ```

## 🔄 Migration

Pour appliquer ces index, exécutez :

```bash
npm run db:migrate
```

Cela créera une nouvelle migration avec les index ajoutés.

## 📝 Recommandations Futures

1. **Index sur TaskAssignee** : Considérez créer une table explicite pour les assignees si vous avez beaucoup de requêtes filtrant par assignee
2. **Index sur dates** : Considérez ajouter des index sur `createdAt`, `updatedAt`, `dueDate` si vous filtrez souvent par dates
3. **Index partiels** : Pour les grandes tables, considérez des index partiels (ex: seulement sur les tâches non archivées)

