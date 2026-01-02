import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark' | undefined;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'taskosaur-theme';

/**
 * ThemeProvider Component
 * 
 * Provides theme management with:
 * - System theme detection
 * - Manual theme toggle
 * - localStorage persistence
 * - Tailwind dark: class support
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = THEME_STORAGE_KEY,
  attribute = 'class',
  enableSystem = true,
}: ThemeProviderProps) {
  const { theme, setTheme: setNextTheme, resolvedTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem(storageKey) as ThemeMode | null;
    
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setNextTheme(storedTheme);
    } else if (!theme) {
      // Use default theme if no stored theme
      setNextTheme(defaultTheme);
    }
  }, [storageKey, defaultTheme, setNextTheme, theme]);

  // Persist theme changes to localStorage
  useEffect(() => {
    if (mounted && theme) {
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey, mounted]);

  // Handle system theme changes
  useEffect(() => {
    if (mounted && theme === 'system' && systemTheme) {
      // Apply system theme changes
      const root = document.documentElement;
      if (systemTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [mounted, theme, systemTheme]);

  const handleSetTheme = useCallback(
    (newTheme: ThemeMode) => {
      setNextTheme(newTheme);
      localStorage.setItem(storageKey, newTheme);
    },
    [setNextTheme, storageKey]
  );

  const toggleTheme = useCallback(() => {
    const currentTheme = theme || defaultTheme;
    
    if (currentTheme === 'system') {
      // If system, toggle to the opposite of resolved theme
      const targetTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
      handleSetTheme(targetTheme);
    } else if (currentTheme === 'light') {
      handleSetTheme('dark');
    } else if (currentTheme === 'dark') {
      handleSetTheme('light');
    }
  }, [theme, defaultTheme, resolvedTheme, handleSetTheme]);

  // Determine if dark mode is active
  const isDark = resolvedTheme === 'dark';
  const isLight = resolvedTheme === 'light';
  const isSystem = theme === 'system';

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  const value: ThemeContextType = {
    theme: (theme as ThemeMode) || defaultTheme,
    resolvedTheme: resolvedTheme || (systemTheme as 'light' | 'dark'),
    setTheme: handleSetTheme,
    toggleTheme,
    isDark,
    isLight,
    isSystem,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme Hook
 * 
 * Custom hook to access theme context
 * 
 * @example
 * ```tsx
 * const { theme, setTheme, toggleTheme, isDark } = useTheme();
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * useThemeMode Hook
 * 
 * Simplified hook that returns only the current theme mode
 */
export function useThemeMode(): ThemeMode {
  const { theme } = useTheme();
  return theme;
}

/**
 * useIsDark Hook
 * 
 * Returns true if dark mode is currently active
 */
export function useIsDark(): boolean {
  const { isDark } = useTheme();
  return isDark;
}

/**
 * ThemeToggle Component
 * 
 * Simple component to toggle between light/dark/system themes
 */
interface ThemeToggleProps {
  showSystem?: boolean;
  className?: string;
}

export function ThemeToggle({ showSystem = true, className }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useTheme();

  if (showSystem) {
    return (
      <div className={className}>
        <button
          onClick={() => {
            if (theme === 'light') {
              setTheme('dark');
            } else if (theme === 'dark') {
              setTheme('system');
            } else {
              setTheme('light');
            }
          }}
          className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {theme === 'light' && '☀️ Light'}
          {theme === 'dark' && '🌙 Dark'}
          {theme === 'system' && '💻 System'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={className}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

