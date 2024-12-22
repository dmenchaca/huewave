import * as DialogPrimitive from '@radix-ui/react-dialog';
import { DialogContent } from './DialogContent';
import { DialogHeader, DialogFooter } from './DialogHeader';
import { DialogTitle, DialogDescription } from './DialogTitle';

export const Dialog = {
  Root: DialogPrimitive.Root,
  Trigger: DialogPrimitive.Trigger,
  Content: DialogContent,
  Header: DialogHeader,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogPrimitive.Close
};