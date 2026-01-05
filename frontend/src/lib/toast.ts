import { toast } from 'sonner';

/**
 * Toast utility functions
 * 
 * Provides a consistent API for displaying toast notifications
 * throughout the application.
 */

/**
 * Display a success toast
 */
export function toastSuccess(message: string, description?: string) {
  return toast.success(message, {
    description,
    duration: 4000,
  });
}

/**
 * Display an error toast
 */
export function toastError(message: string, description?: string) {
  return toast.error(message, {
    description,
    duration: 5000, // Longer duration for errors
  });
}

/**
 * Display a warning toast
 */
export function toastWarning(message: string, description?: string) {
  return toast.warning(message, {
    description,
    duration: 4000,
  });
}

/**
 * Display an info toast
 */
export function toastInfo(message: string, description?: string) {
  return toast.info(message, {
    description,
    duration: 4000,
  });
}

/**
 * Display a loading toast (returns a function to update/close it)
 */
export function toastLoading(message: string) {
  return toast.loading(message);
}

/**
 * Display a promise-based toast
 * 
 * @param promise - The promise to track
 * @param messages - Object with loading, success, and error messages
 * @returns The promise result
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
): Promise<T> {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
}

/**
 * Dismiss a toast by ID
 */
export function toastDismiss(id?: string | number) {
  toast.dismiss(id);
}

/**
 * Dismiss all toasts
 */
export function toastDismissAll() {
  toast.dismiss();
}

/**
 * Replace console.log with toast (for development)
 */
export function toastLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data);
    toastInfo(message, data ? JSON.stringify(data, null, 2) : undefined);
  }
}

/**
 * Replace console.error with toast
 */
export function toastLogError(message: string, error?: any) {
  console.error(message, error);
  toastError(
    message,
    error instanceof Error ? error.message : error?.message || String(error),
  );
}

/**
 * Replace console.warn with toast
 */
export function toastLogWarn(message: string, data?: any) {
  console.warn(message, data);
  toastWarning(message, data ? JSON.stringify(data, null, 2) : undefined);
}

/**
 * Replace alert() with toast
 */
export function toastAlert(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  switch (type) {
    case 'success':
      return toastSuccess(message);
    case 'error':
      return toastError(message);
    case 'warning':
      return toastWarning(message);
    default:
      return toastInfo(message);
  }
}


