import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookingForm } from './BookingForm';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookingDialog: React.FC<BookingDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book New Shipment</DialogTitle>
          <DialogDescription>
            Enter details for your new shipment booking request.
          </DialogDescription>
        </DialogHeader>
        <BookingForm onSuccess={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />
        {/* <div className="p-10 text-center border-2 border-dashed border-yellow-500 bg-yellow-500/10 rounded-none">
                    <h3 className="text-xl font-bold text-yellow-500">Debug Mode</h3>
                    <p className="text-muted-foreground">Booking form is temporarily disabled to isolate the redirect issue.</p>
                    <button type="button" className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-none" onClick={() => onOpenChange(false)}>Close Dialog</button>
                </div> */}
      </DialogContent>
    </Dialog>
  );
};
