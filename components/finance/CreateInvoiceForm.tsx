import React from 'react';
import MultiStepCreateInvoice from './MultiStepCreateInvoice';
import { Invoice, Shipment } from '@/types';
import { InvoiceWithRelations } from '@/hooks/useInvoices';

interface Props {
  onSuccess: (invoice?: Invoice, shipment?: Shipment) => void;
  onCancel: () => void;
  initialData?: InvoiceWithRelations;
}

export const CreateInvoiceForm: React.FC<Props> = ({ onSuccess, onCancel, initialData }) => {
  return (
    <MultiStepCreateInvoice onSuccess={onSuccess} onCancel={onCancel} initialData={initialData} />
  );
};
