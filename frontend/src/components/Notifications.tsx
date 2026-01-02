import { useTheme } from 'next-themes';
import { Toaster as SonnerToaster, ToasterProps } from 'sonner';

/**
 * Notifications Component
 * 
 * Global toast notification system using Sonner.
 * This component should be placed at the root of the application.
 * 
 * Features:
 * - Success, error, warning, and info toasts
 * - Promise-based toasts for async operations
 * - Rich colors and close button
 * - Position and styling customization
 * - Theme-aware (light/dark mode)
 */
export function Notifications() {
  const { theme = 'system' } = useTheme();

  return (
    <SonnerToaster
      theme={theme as ToasterProps['theme']}
      position="top-right"
      expand={false}
      richColors
      closeButton
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--background)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
        },
        classNames: {
          toast: 'toast-group',
          title: 'toast-title',
          description: 'toast-description',
          actionButton: 'toast-action-button',
          cancelButton: 'toast-cancel-button',
        },
      }}
    />
  );
}

