import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  const regularToasts = toasts.filter(toast => toast.variant !== 'shortcut')
  const shortcutToasts = toasts.filter(toast => toast.variant === 'shortcut')

  return (
    <ToastProvider>
      {/* Default notification viewport - top right */}
      <ToastViewport 
        className={cn(
          "fixed flex flex-col-reverse gap-2 outline-none p-4",
          "top-0 right-0 sm:right-4 sm:top-4",
          "max-w-[420px] z-[100]"
        )}
      >
        {regularToasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          )
        })}
      </ToastViewport>

      {/* Shortcut toast viewport - centered bottom */}
      <ToastViewport 
        isCentered
        className={cn(
          "fixed left-1/2 -translate-x-1/2 bottom-4",
          "flex flex-col gap-2 max-w-[500px]",
          "outline-none z-[100] p-4",
          "motion-safe:transform-gpu",
          "motion-reduce:transition-none motion-reduce:transform-none"
        )}
      >
        {shortcutToasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
            </Toast>
          )
        })}
      </ToastViewport>
    </ToastProvider>
  )
}
