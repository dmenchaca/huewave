import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export const SheetClose: React.FC = () => (
  <SheetPrimitive.Close 
    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </SheetPrimitive.Close>
);