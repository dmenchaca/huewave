import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { SheetOverlay } from './SheetOverlay';
import { SheetClose } from './SheetClose';
import { cn } from '../../../lib/utils';

export const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, title = "Sheet", ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetOverlay blur />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-800 shadow-lg',
        'border-t rounded-t-xl',
        'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
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