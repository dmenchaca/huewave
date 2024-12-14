
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

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isShortcut = props.variant === 'shortcut'
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            {!isShortcut && <ToastClose />}
          </Toast>
        )
      })}
      {/* Default notification viewport - top right */}
      <ToastViewport 
        className={cn(
          "fixed flex flex-col gap-2 list-none outline-none p-4",
          "top-0 right-0 sm:bottom-0 sm:right-0 sm:top-auto",
          "w-[90vw] md:max-w-[420px] z-[100]"
        )}
      />
      {/* Shortcut toast viewport - centered bottom */}
      <ToastViewport 
        isCentered
        className={cn(
          "fixed left-1/2 -translate-x-1/2 bottom-4",
          "flex flex-col gap-2 w-[90vw] md:max-w-[500px]",
          "outline-none list-none z-[100] p-4"
        )}
      />
    </ToastProvider>
  )
}
