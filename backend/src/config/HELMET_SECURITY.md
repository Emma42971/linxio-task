# Configuration Helmet - Headers de Sécurité

## 📋 Vue d'ensemble

Helmet est configuré pour ajouter des en-têtes de sécurité HTTP essentiels à toutes les réponses de l'application.

## 🔒 Headers de Sécurité Implémentés

### 1. Content Security Policy (CSP)
**Protection** : Empêche les attaques XSS, l'injection de code, et le clickjacking

**Configuration** :
- `defaultSrc: 'self'` - Seulement les ressources de la même origine
- `styleSrc` - Permet les styles inline (nécessaire pour Swagger UI) et Google Fonts
- `scriptSrc` - Permet les scripts inline et eval (nécessaire pour Swagger UI)
- `imgSrc` - Permet les images de toutes sources (https, http, data)
- `connectSrc` - Permet les connexions vers le frontend et l'API
- `frameAncestors: 'self'` - Empêche le clickjacking
- `upgradeInsecureRequests` - Force HTTPS en production

### 2. XSS Protection
**Protection** : Active le filtre XSS intégré des navigateurs

**Configuration** :
```typescript
xssFilter: true
```

### 3. HSTS (HTTP Strict Transport Security)
**Protection** : Force les connexions HTTPS et empêche les attaques de downgrade

**Configuration** :
- **Production** :
  - `maxAge: 31536000` (1 an)
  - `includeSubDomains: true`
  - `preload: true` (éligible pour la liste de préchargement HSTS)
- **Développement** : Désactivé (pour permettre HTTP local)

### 4. X-Frame-Options
**Protection** : Empêche le clickjacking en contrôlant qui peut encadrer la page

**Configuration** :
```typescript
frameguard: {
  action: 'sameorigin' // Permet le framing depuis la même origine uniquement
}
```

**Note** : Également configuré via CSP `frameAncestors`

### 5. Autres Headers de Sécurité

#### X-Content-Type-Options: nosniff
**Protection** : Empêche le MIME type sniffing

#### Referrer-Policy
**Protection** : Contrôle les informations de referrer envoyées

**Configuration** :
```typescript
referrerPolicy: 'strict-origin-when-cross-origin'
```

#### Permissions Policy (anciennement Feature Policy)
**Protection** : Contrôle quelles fonctionnalités du navigateur peuvent être utilisées

**Configuration** :
- `geolocation: 'self'` - Permet la géolocalisation depuis la même origine
- `microphone: 'none'` - Désactive le microphone
- `camera: 'none'` - Désactive la caméra

## 🔧 Configuration

La configuration est centralisée dans `backend/src/config/helmet.config.ts` et utilisée dans `main.ts`.

### Variables d'Environnement Utilisées

- `NODE_ENV` - Détermine si on est en production (active HSTS)
- `FRONTEND_URL` - URL du frontend pour CSP `connectSrc`
- `NEXT_PUBLIC_API_BASE_URL` - URL de l'API pour CSP `connectSrc`

### Personnalisation

Pour modifier la configuration CSP ou d'autres headers, éditez `backend/src/config/helmet.config.ts`.

**Exemple** : Ajouter un domaine externe à CSP

```typescript
connectSrc: [
  "'self'",
  frontendUrl,
  apiBaseUrl,
  'https://api.external-service.com', // Nouveau domaine
],
```

## 🧪 Vérification

### Tester les Headers

```bash
# Vérifier les headers de sécurité
curl -I http://localhost:3000/api/health

# Ou avec curl détaillé
curl -v http://localhost:3000/api/health 2>&1 | grep -i "content-security-policy\|x-frame-options\|strict-transport-security"
```

### Headers Attendus

En production, vous devriez voir :
```
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ...
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), microphone=(), camera=()
```

## ⚠️ Notes Importantes

### Swagger UI

La configuration CSP inclut `'unsafe-inline'` et `'unsafe-eval'` pour permettre à Swagger UI de fonctionner. En production, considérez :

1. **Option 1** : Désactiver Swagger UI en production
2. **Option 2** : Utiliser une CSP plus stricte et servir Swagger UI depuis un sous-domaine séparé
3. **Option 3** : Utiliser une version non-interactive de Swagger (JSON/OpenAPI uniquement)

### WebSocket (Développement)

En développement, les WebSockets sont autorisés via CSP `connectSrc` pour permettre le hot-reload et les fonctionnalités temps réel.

### HTTPS en Production

HSTS n'est activé qu'en production. Assurez-vous que :
- Votre serveur reverse proxy (Nginx, etc.) gère HTTPS
- Les certificats SSL/TLS sont valides
- La redirection HTTP → HTTPS est configurée

## 📚 Ressources

- [Helmet Documentation](https://helmetjs.github.io/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)


