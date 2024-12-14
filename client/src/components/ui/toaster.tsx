import { useToast } from "@/hooks/use-toast"
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
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            {props.variant !== 'shortcut' && <ToastClose />}
          </Toast>
        )
      })}
      <ToastViewport 
        className={cn(
          "fixed flex flex-col gap-2 w-[90vw] md:max-w-[420px] list-none z-[100] outline-none p-4",
          toasts.some((toast) => toast.variant === 'shortcut')
            ? "bottom-4 left-1/2 -translate-x-1/2"
            : "top-0 right-0 sm:bottom-0 sm:right-0 sm:top-auto"
        )}
      />
    </ToastProvider>
  )
}
