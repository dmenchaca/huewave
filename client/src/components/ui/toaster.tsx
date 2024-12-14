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
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport 
        className={toasts.some((toast) => toast.variant === 'shortcut') 
          ? "fixed bottom-0 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 w-[90vw] md:max-w-[500px] m-0 list-none z-[100] outline-none"
          : undefined
        } 
      />
    </ToastProvider>
  )
}
