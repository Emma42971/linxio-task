# ThemeContext - Guide d'utilisation

## 📋 Vue d'ensemble

Le `ThemeContext` fournit une gestion complète des thèmes avec support du thème système, toggle manuel, et persistence localStorage. Il est construit sur `next-themes` et supporte les classes Tailwind `dark:`.

## ✨ Fonctionnalités

- ✅ **Support système** : Détection automatique du thème système
- ✅ **Toggle manuel** : Basculement entre light/dark/system
- ✅ **Persistence** : Sauvegarde dans localStorage
- ✅ **Tailwind dark:** : Support complet des classes dark: de Tailwind
- ✅ **Type-safe** : Typage TypeScript complet
- ✅ **SSR-safe** : Pas de mismatch d'hydratation

## 🚀 Utilisation

### 1. Configuration dans _app.tsx

Le `ThemeProvider` est déjà configuré dans `_app.tsx` :

```typescript
import { ThemeProvider } from "@/contexts/ThemeContext";

<ThemeProvider defaultTheme="system" enableSystem>
  {/* Votre application */}
</ThemeProvider>
```

### 2. Utilisation du hook useTheme

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, toggleTheme, isDark, isLight, isSystem } = useTheme();

  return (
    <div>
      <p>Thème actuel: {theme}</p>
      <p>Mode sombre: {isDark ? 'Oui' : 'Non'}</p>
      <button onClick={toggleTheme}>Toggle</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

### 3. Hooks simplifiés

```typescript
import { useThemeMode, useIsDark } from '@/contexts/ThemeContext';

function MyComponent() {
  const theme = useThemeMode(); // 'light' | 'dark' | 'system'
  const isDark = useIsDark(); // boolean
}
```

### 4. Composant ThemeToggle

```typescript
import { ThemeToggle } from '@/contexts/ThemeContext';

function Header() {
  return (
    <header>
      <ThemeToggle showSystem={true} />
    </header>
  );
}
```

## 🎨 Utilisation avec Tailwind

### Classes dark: automatiques

Le contexte applique automatiquement la classe `dark` sur `<html>`, donc toutes les classes Tailwind `dark:` fonctionnent :

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Contenu adaptatif
</div>
```

### Exemple complet

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function Card() {
  const { isDark } = useTheme();

  return (
    <div className={`
      p-6 rounded-lg
      bg-white dark:bg-gray-800
      text-gray-900 dark:text-gray-100
      border border-gray-200 dark:border-gray-700
      shadow-md dark:shadow-lg
    `}>
      <h2 className="text-xl font-bold">Titre</h2>
      <p>Contenu de la carte</p>
    </div>
  );
}
```

## 📝 API

### ThemeContextType

```typescript
interface ThemeContextType {
  theme: ThemeMode; // 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark' | undefined; // Thème réellement appliqué
  setTheme: (theme: ThemeMode) => void; // Changer le thème
  toggleTheme: () => void; // Basculer entre light/dark
  isDark: boolean; // true si dark mode actif
  isLight: boolean; // true si light mode actif
  isSystem: boolean; // true si thème système
}
```

### Hooks

#### useTheme()

Retourne l'objet complet du contexte.

```typescript
const { theme, setTheme, toggleTheme, isDark } = useTheme();
```

#### useThemeMode()

Retourne uniquement le mode de thème actuel.

```typescript
const theme = useThemeMode(); // 'light' | 'dark' | 'system'
```

#### useIsDark()

Retourne true si le dark mode est actif.

```typescript
const isDark = useIsDark(); // boolean
```

## 🔧 Configuration

### Props du ThemeProvider

```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode; // 'light' | 'dark' | 'system' (default: 'system')
  storageKey?: string; // Clé localStorage (default: 'taskosaur-theme')
  attribute?: string; // Attribut HTML (default: 'class')
  enableSystem?: boolean; // Activer le thème système (default: true)
}
```

### Exemple de configuration personnalisée

```typescript
<ThemeProvider
  defaultTheme="dark"
  storageKey="my-app-theme"
  enableSystem={true}
>
  {children}
</ThemeProvider>
```

## 🎯 Exemples d'utilisation

### Exemple 1 : Toggle simple

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function ThemeButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

### Exemple 2 : Sélecteur de thème

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeMode)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

### Exemple 3 : Styles conditionnels

```typescript
import { useIsDark } from '@/contexts/ThemeContext';

function ThemedComponent() {
  const isDark = useIsDark();

  return (
    <div style={{
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
    }}>
      Contenu
    </div>
  );
}
```

### Exemple 4 : Icône adaptative

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function ThemeIcon() {
  const { resolvedTheme } = useTheme();

  if (resolvedTheme === 'dark') {
    return <SunIcon />;
  }
  return <MoonIcon />;
}
```

## 💾 Persistence

Le thème est automatiquement sauvegardé dans `localStorage` avec la clé `taskosaur-theme` (configurable).

### Vérifier le thème stocké

```typescript
const storedTheme = localStorage.getItem('taskosaur-theme');
console.log('Thème stocké:', storedTheme);
```

### Réinitialiser le thème

```typescript
localStorage.removeItem('taskosaur-theme');
// Recharger la page pour appliquer le thème par défaut
```

## 🎨 Classes Tailwind recommandées

### Couleurs de fond

```tsx
className="bg-white dark:bg-gray-900"
className="bg-gray-50 dark:bg-gray-800"
```

### Texte

```tsx
className="text-gray-900 dark:text-gray-100"
className="text-gray-600 dark:text-gray-400"
```

### Bordures

```tsx
className="border-gray-200 dark:border-gray-700"
```

### Ombres

```tsx
className="shadow-md dark:shadow-lg"
```

## 🔍 Dépannage

### Le thème ne change pas

1. Vérifiez que `ThemeProvider` enveloppe votre application
2. Vérifiez que `attribute="class"` est défini sur `NextThemesProvider`
3. Vérifiez que Tailwind est configuré avec `darkMode: ['class']`

### Hydration mismatch

Le contexte gère automatiquement l'hydratation. Si vous voyez des erreurs :

1. Utilisez `mounted` state pour éviter le rendu côté serveur
2. Utilisez `useIsDark()` au lieu de vérifier directement `theme === 'dark'`

### Classes dark: ne fonctionnent pas

1. Vérifiez `tailwind.config.js` : `darkMode: ['class']`
2. Vérifiez que la classe `dark` est appliquée sur `<html>`
3. Utilisez les variables CSS pour une meilleure compatibilité

## 📚 Références

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [ThemeContext.tsx](/frontend/src/contexts/ThemeContext.tsx)

