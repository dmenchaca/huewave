import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { SheetOverlay } from './SheetOverlay';
import { SheetClose } from './SheetClose';
import { cn } from '../../../lib/utils';

export const SideSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, title = "Menu", ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-y-0 right-0 z-50 h-full w-[280px] border-l bg-white dark:bg-gray-800 dark:border-gray-700',
        'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        className
      )}
      {...props}
    >
      <SheetPrimitive.Title className="sr-only">
        {title}
      </SheetPrimitive.Title>
      {children}
      <SheetClose />
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));