import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { BookingForm } from './BookingForm';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookingDialog: React.FC<BookingDialogProps> = ({ open, onOpenChange }) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-4xl p-0 flex flex-col h-full bg-background border-l border-border/40 shadow-2xl">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0 bg-muted/5">
            <SheetTitle className="text-xl font-semibold tracking-tight">Book New Shipment</SheetTitle>
            <SheetDescription>Enter details for your new shipment booking request.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <BookingForm onSuccess={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Book New Shipment</DrawerTitle>
          <DrawerDescription>
            Enter details for your new shipment booking request.
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto p-4 pb-0 flex-1">
          <BookingForm
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
            isMobile
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
