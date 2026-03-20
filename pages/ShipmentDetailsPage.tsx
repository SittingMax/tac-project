import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShipmentById } from '@/hooks/useShipments';
import { ShipmentDetails } from '@/components/shipments/ShipmentDetails';
import { PageContainer, PageHeader, SectionCard } from '@/components/ui-core/layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { adaptToShipment } from '@/lib/utils/shipment-adapter';

export const ShipmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: shipment, isLoading, error } = useShipmentById(id);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Shipment Details" description="Loading shipment details" />
        <SectionCard>
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  if (error || !shipment) {
    return (
      <PageContainer>
        <PageHeader title="Shipment Details" description="Unable to load the requested shipment">
          <Button variant="ghost" onClick={() => navigate('/shipments')}>
            <ArrowLeft size={16} strokeWidth={1.5} className="mr-2" /> Back
          </Button>
        </PageHeader>
        <SectionCard>
          <div className="flex min-h-[40vh] flex flex-col items-center justify-center flex flex-col gap-4 text-center">
            <h2 className="text-xl font-bold text-destructive">Shipment not found</h2>
            <p className="text-muted-foreground">
              The shipment you are looking for does not exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/shipments')}>Back to Shipments</Button>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  const handleClose = () => {
    navigate('/shipments');
  };

  return (
    <PageContainer>
      <PageHeader title={`Shipment ${shipment.cn_number}`} description="Detailed view">
        <Button variant="ghost" onClick={handleClose}>
          <ArrowLeft size={16} strokeWidth={1.5} className="mr-2" /> Back
        </Button>
      </PageHeader>

      <SectionCard>
        <ShipmentDetails shipment={adaptToShipment(shipment)} onClose={handleClose} />
      </SectionCard>
    </PageContainer>
  );
};

export default ShipmentDetailsPage;
