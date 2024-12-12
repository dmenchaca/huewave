import * as React from "react"
import { Button } from "@/components/ui/button"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  children: React.ReactNode
  variant?: "default" | "outline" | "destructive" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    asChild = false, 
    children,
    ...props 
  }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          // Base styles for consistent rounded corners and transitions
          "rounded-[8px] transition-all duration-200 ease-in-out",
          // Focus states with consistent ring styling and rounded corners
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Hover states based on variant with smooth transitions
          variant === "default" && [
            "hover:bg-primary/90 active:bg-primary/95",
            "transition-colors duration-200"
          ],
          variant === "destructive" && [
            "hover:bg-destructive/90 active:bg-destructive/95",
            "transition-colors duration-200"
          ],
          variant === "outline" && [
            "border-2 hover:bg-accent hover:text-accent-foreground",
            "active:bg-accent/90 transition-colors duration-200"
          ],
          variant === "ghost" && [
            "hover:bg-accent hover:text-accent-foreground",
            "active:bg-accent/90 transition-colors duration-200"
          ],
          variant === "link" && "underline-offset-4 hover:underline",
          // Active/pressed states with subtle scale animation
          "active:scale-[0.98] transition-transform duration-200",
          // Disabled state
          "disabled:pointer-events-none disabled:opacity-50",
          // Icon and text handling with consistent sizing
          "[&>span]:truncate [&_svg]:size-4 [&_svg]:shrink-0",
          // Standard spacing and typography
          "px-4 py-2 text-sm font-medium leading-none",
          // Sizing variants with consistent spacing
          size === "sm" && "h-8 px-3 py-1 text-xs",
          size === "lg" && "h-11 px-6 py-3 text-base",
          size === "icon" && "h-9 w-9 p-2",
          // Loading state styling
          "[&>span.loading-spinner]:mr-2 [&>span.loading-spinner]:size-4",
          // Custom className from props
          className
        )}
        asChild={asChild}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
AppButton.displayName = "AppButton"

export { AppButton }
