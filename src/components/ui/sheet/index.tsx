import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { SideSheetContent } from './SideSheetContent';
import { BottomSheetContent } from './BottomSheetContent';
import { SheetHeader } from './SheetHeader';
import { SheetClose } from './SheetClose';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SideSheetContent,
  BottomSheetContent,
};