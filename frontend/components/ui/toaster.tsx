'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  const getToastIcon = (variant?: string) => {
    if (variant === 'destructive') {
      return '❌'
    }
    // Check if title or description contains success keywords
    return '✅' // Default to success for now, we'll enhance this
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variant === 'destructive' ? '❌' : 
                     (title?.toString().toLowerCase().includes('success') || 
                      title?.toString().toLowerCase().includes('created') ||
                      title?.toString().toLowerCase().includes('updated') ||
                      title?.toString().toLowerCase().includes('deleted') ||
                      title?.toString().toLowerCase().includes('saved')) ? '✅' : 'ℹ️'
        
        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">{icon}</span>
              <div className="grid gap-1 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
