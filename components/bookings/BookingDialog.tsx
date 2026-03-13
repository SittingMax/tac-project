import React from 'react';
import { SizedDialog } from '@/components/ui-core/dialog/sized-dialog';
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
      <SizedDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Book New Shipment"
        description="Enter details for your new shipment booking request."
        size="xl"
      >
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <BookingForm onSuccess={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />
        </div>
      </SizedDialog>
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
