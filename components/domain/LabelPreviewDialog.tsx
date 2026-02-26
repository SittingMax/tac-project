import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { sanitizeString } from '../../lib/utils/sanitize';
import { generateLabelPDF } from '@/lib/pdf-generator';

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
      shipDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      invoiceDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
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
      console.error('[LabelPreview] PDF generation failed:', error);
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
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto z-[100]">
        <DialogHeader>
          <DialogTitle>Shipping Label Preview</DialogTitle>
          <DialogDescription>Customize and print your shipping label</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="customize">Customize</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="max-h-[calc(90vh-280px)] overflow-y-auto overflow-x-hidden border rounded-none p-4 bg-muted/30">
              <LabelGenerator data={labelData} onPrint={handlePrint} />
            </div>
          </TabsContent>

          <TabsContent value="customize" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
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

              <div className="space-y-2">
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

            <div className="p-4 bg-muted rounded-none">
              <h4 className="font-semibold mb-2">Preview Changes</h4>
              <p className="text-sm text-muted-foreground">
                Switch to the Preview tab to see your customizations applied to the label.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPreviewDialog;
