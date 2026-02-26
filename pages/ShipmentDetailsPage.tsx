import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShipmentById } from '@/hooks/useShipments';
import { ShipmentDetails } from '@/components/shipments/ShipmentDetails';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { adaptToShipment } from '@/lib/utils/shipment-adapter';

export const ShipmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: shipment, isLoading, error } = useShipmentById(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-none animate-spin"></div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-xl font-bold text-destructive">Shipment not found</h2>
        <p className="text-muted-foreground">
          The shipment you are looking for does not exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/shipments')}>Back to Shipments</Button>
      </div>
    );
  }

  const handleClose = () => {
    navigate('/shipments');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleClose}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <PageHeader title={`Shipment ${shipment.cn_number}`} description="Detailed view" />
      </div>

      <div className="bg-card rounded-none border border-border p-6 shadow-sm">
        <ShipmentDetails shipment={adaptToShipment(shipment)} onClose={handleClose} />
      </div>
    </div>
  );
};

export default ShipmentDetailsPage;
