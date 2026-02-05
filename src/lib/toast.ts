/**
 * Toast Notification Utility
 * Centralized toast notification system using sonner
 */

import { toast as sonnerToast } from "sonner";

export const toast = {
  /**
   * Show success notification
   */
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      duration: 3000,
    });
  },

  /**
   * Show error notification
   */
  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      duration: 5000,
    });
  },

  /**
   * Show warning notification
   */
  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show info notification
   */
  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      duration: 3000,
    });
  },

  /**
   * Show loading notification (returns a toast ID for updating)
   */
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  /**
   * Dismiss a toast by ID
   */
  dismiss: (toastId: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Show promise notification (for async operations)
   */
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};
