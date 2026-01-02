# Instructions d'Installation des Améliorations

Ce document contient les instructions pour installer et configurer les améliorations apportées au projet.

## 📦 Dépendances à Installer

### Backend

```bash
cd backend
npm install @nestjs/throttler
```

## 🔧 Configuration

### 1. Rate Limiting

Le rate limiting est maintenant configuré dans `app.module.ts` avec trois niveaux :

- **Général** : 100 requêtes par minute
- **Auth** : 5 requêtes par minute (pour login, register, etc.)
- **Strict** : 10 requêtes par minute (pour les endpoints sensibles)

Pour utiliser le rate limiting strict sur un endpoint spécifique :

```typescript
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('sensitive-endpoint')
```

### 2. Variables d'Environnement

Assurez-vous que les variables suivantes sont définies :

```env
# Production - REQUIS
ENCRYPTION_KEY=your-64-character-hex-encryption-key

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**⚠️ IMPORTANT** : En production, l'application ne démarrera pas si `ENCRYPTION_KEY` n'est pas définie.

### 3. TypeScript Strict Mode

Le mode strict TypeScript est maintenant activé. Vous devrez peut-être corriger certains types :

```bash
cd backend
npm run build
```

Corrigez les erreurs de type qui apparaissent.

## 🚀 Vérification

### Vérifier que tout fonctionne

1. **Sécurité** :
   ```bash
   # En production, sans ENCRYPTION_KEY, l'app ne doit pas démarrer
   NODE_ENV=production npm run start:prod
   ```

2. **Rate Limiting** :
   ```bash
   # Tester avec curl - devrait bloquer après 5 tentatives
   for i in {1..10}; do curl -X POST http://localhost:3000/api/auth/login; done
   ```

3. **TypeScript** :
   ```bash
   npm run build
   ```

## 📝 Notes

- Les exceptions personnalisées sont disponibles dans `backend/src/common/exceptions/business-exceptions.ts`
- Le filtre d'exceptions global est dans `backend/src/common/exceptions/all-exceptions.filter.ts`
- Tous les `console.log` doivent être remplacés par le logger NestJS (en cours)

## 🔄 Prochaines Étapes

1. Installer `@nestjs/throttler`
2. Corriger les erreurs TypeScript après activation du strict mode
3. Remplacer progressivement les `console.log` par des loggers
4. Ajouter des tests unitaires pour les nouveaux composants

