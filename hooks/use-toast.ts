import { useToast as useToastContext } from '@/contexts/toast-context'

export const useToast = () => {
  const { showToast } = useToastContext()

  const toast = {
    success: (title: string, message?: string, options?: { duration?: number; dismissible?: boolean }) => 
      showToast({ type: 'success', title, message, ...options }),

    error: (title: string, message?: string, options?: { duration?: number; dismissible?: boolean }) => 
      showToast({ type: 'error', title, message, ...options }),

    warning: (title: string, message?: string, options?: { duration?: number; dismissible?: boolean }) => 
      showToast({ type: 'warning', title, message, ...options }),

    info: (title: string, message?: string, options?: { duration?: number; dismissible?: boolean }) => 
      showToast({ type: 'info', title, message, ...options }),

    custom: (title: string, message?: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', options?: { duration?: number; dismissible?: boolean }) =>
      showToast({ type, title, message, ...options })
  }

  return { toast }
}