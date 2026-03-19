import React, { useState } from 'react';
import { SizedDialog } from '@/components/ui-core/dialog/sized-dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Printer, Download, Eye } from 'lucide-react';
import { LabelGenerator, LabelData, ServiceLevel, TransportMode } from './LabelGenerator';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { sanitizeString } from '../../lib/utils/sanitize';
import { generateLabelPDF } from '@/lib/pdf-generator';
import { formatDate } from '@/lib/formatters';

interface LabelPreviewDialogProps {
  trigger?: React.ReactNode;
  shipmentData?: Partial<LabelData>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const LabelPreviewDialog: React.FC<LabelPreviewDialogProps> = ({
  trigger,
  shipmentData,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>(
    shipmentData?.serviceLevel || 'STANDARD'
  );
  const [transportMode, setTransportMode] = useState<TransportMode>(
    shipmentData?.transportMode || 'TRUCK'
  );

  // Sync state with props when dialog opens or data changes
  // Sync state with props when dialog opens or data changes
  React.useEffect(() => {
    if (shipmentData) {
      if (shipmentData.transportMode) {
        setTransportMode(shipmentData.transportMode);
      }
      if (shipmentData.serviceLevel) {
        setServiceLevel(shipmentData.serviceLevel);
      }
    }
  }, [shipmentData]);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const labelData: LabelData = {
    awb: shipmentData?.awb || 'TAC-PENDING',
    transportMode,
    serviceLevel,
    serviceName: `${serviceLevel} ${transportMode === 'AIR' ? 'AIR' : 'SURFACE'}`,
    serviceCode: serviceLevel === 'PRIORITY' ? 'PRI' : serviceLevel === 'EXPRESS' ? 'EXP' : 'STD',
    weight: shipmentData?.weight || 0,
    weightUnit: shipmentData?.weightUnit || 'kg',
    paymentMode: shipmentData?.paymentMode || 'TO PAY',
    recipient: shipmentData?.recipient || {
      name: 'RECIPIENT NAME',
      address: 'Address Line',
      city: 'City',
      state: 'State',
    },
    routing: shipmentData?.routing || {
      origin: 'DEL',
      destination: 'IMF',
      deliveryStation: 'IMF',
      originSort: 'DEL',
      destSort: 'IMF',
    },
    dates: shipmentData?.dates || {
      shipDate: formatDate(new Date(), 'en-GB'),
      invoiceDate: formatDate(new Date(), 'en-GB'),
    },
    gstNumber: shipmentData?.gstNumber,
  };

  const handlePrint = () => {
    toast.info('Opening print dialog...');
    window.print();
  };

  const handleDownload = async () => {
    try {
      toast.info('Generating label PDF...');

      // Generate PDF directly from labelData — same data the HTML preview uses
      const pdfUrl = await generateLabelPDF(labelData);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `LABEL-${labelData.awb}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);

      toast.success('Label downloaded as PDF');
    } catch (error) {
      logger.error('LabelPreviewDialog', 'PDF generation failed', { error });
      toast.error('Failed to generate label PDF');
    }
  };

  // Set document title for printing
  React.useEffect(() => {
    if (shipmentData?.recipient?.name) {
      document.title = `LABEL-${shipmentData.awb}-${sanitizeString(shipmentData.recipient.name)}`;
    } else {
      document.title = `LABEL-${shipmentData?.awb || 'PREVIEW'}`;
    }
    // Cleanup
    return () => {
      document.title = 'TAC Portal';
    };
  }, [shipmentData]);

  return (
    <SizedDialog
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title="Shipping Label Preview"
      description="Customize and print your shipping label"
      size="xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
        {/* Left Side: Customization */}
        <div className="flex flex-col gap-6 flex-col">
          <div className="bg-muted px-4 py-3 border rounded-md">
            <h4 className="font-semibold text-sm mb-1">Label Settings</h4>
            <p className="text-xs text-muted-foreground">
              Adjust the transport mode and service level for this label.
            </p>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="transport-mode">Transport Mode</Label>
              <Select
                value={transportMode}
                onValueChange={(v) => setTransportMode(v as TransportMode)}
              >
                <SelectTrigger id="transport-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AIR">Air Cargo</SelectItem>
                  <SelectItem value="TRUCK">Surface / Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="service-level">Service Level</Label>
              <Select
                value={serviceLevel}
                onValueChange={(v) => setServiceLevel(v as ServiceLevel)}
              >
                <SelectTrigger id="service-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard (3-5 Days)</SelectItem>
                  <SelectItem value="EXPRESS">Express (1-2 Days)</SelectItem>
                  <SelectItem value="PRIORITY">Priority (Same Day)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className="flex flex-col border rounded-md overflow-hidden bg-background">
          <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Eye size={16} strokeWidth={1.5} /> Live Preview
            </h4>
          </div>
          <div className="p-4 bg-muted/10 overflow-y-auto max-h-[calc(80vh-200px)] flex justify-center items-start">
            <LabelGenerator data={labelData} hidePrintButton />
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download size={16} strokeWidth={1.5} className="mr-2" />
          Download PDF
        </Button>
        <Button onClick={handlePrint}>
          <Printer size={16} strokeWidth={1.5} className="mr-2" />
          Print Label
        </Button>
      </DialogFooter>
    </SizedDialog>
  );
};

export default LabelPreviewDialog;
