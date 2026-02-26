import { QRCodeSVG } from 'qrcode.react';
import { Shipment, HubLocation } from '@/types';
import { format } from 'date-fns';
import { UniversalBarcode } from '@/components/barcodes';

interface ShippingLabelProps {
  shipment: Shipment;
  packageIndex?: number;
}

const HUB_INFO: Record<HubLocation, { code: string; name: string; sortCode: string }> = {
  IMPHAL: { code: 'IXB', name: 'Imphal Hub', sortCode: 'IMP-01' },
  NEW_DELHI: { code: 'DEL', name: 'New Delhi Hub', sortCode: 'DEL-01' },
};

export function ShippingLabel({ shipment, packageIndex = 1 }: ShippingLabelProps) {
  const origin = HUB_INFO[shipment.originHub];
  const dest = HUB_INFO[shipment.destinationHub];

  const qrData = JSON.stringify({
    awb: shipment.awb,
    pkg: `${shipment.awb}-${packageIndex}`,
    from: origin.code,
    to: dest.code,
    wt: shipment.totalWeight.chargeable,
  });

  return (
    <div className="bg-white text-black p-4 font-sans" style={{ width: '4in', height: '6in' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-2 mb-3">
        <h1 className="text-2xl font-black tracking-tight">TAC</h1>
        <p className="text-xs text-muted-foreground">Express Logistics • Imphal ↔ New Delhi</p>
      </div>

      {/* AWB Barcode */}
      <div className="flex justify-center mb-3">
        <UniversalBarcode
          value={shipment.awb}
          mode="print"
          displayValue={true}
          fontSize={12}
          className="w-full max-w-[280px]"
        />
      </div>

      {/* Route Display */}
      <div className="flex items-center justify-between bg-foreground text-background rounded-none p-3 mb-3">
        <div className="text-center flex-1">
          <p className="text-3xl font-black">{origin.code}</p>
          <p className="text-[10px] opacity-70">{origin.name}</p>
        </div>
        <div className="text-2xl px-4">→</div>
        <div className="text-center flex-1">
          <p className="text-3xl font-black">{dest.code}</p>
          <p className="text-[10px] opacity-70">{dest.name}</p>
        </div>
      </div>

      {/* Sort Code */}
      <div className="text-center bg-muted rounded-none py-2 mb-3">
        <p className="text-xs text-muted-foreground">SORT CODE</p>
        <p className="text-2xl font-black font-mono">{dest.sortCode}</p>
      </div>

      {/* Package Info */}
      <div className="flex justify-between items-center border border-border rounded-none p-2 mb-3">
        <div>
          <p className="text-xs text-muted-foreground">PACKAGE</p>
          <p className="text-xl font-bold">
            {packageIndex} of {shipment.totalPackageCount}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">WEIGHT</p>
          <p className="text-xl font-bold">{shipment.totalWeight.chargeable} kg</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">MODE</p>
          <p className="text-xl font-bold">{shipment.mode}</p>
        </div>
      </div>

      {/* QR Code & Consignee */}
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <QRCodeSVG value={qrData} size={80} level="M" />
        </div>
        <div className="flex-1 border-l border-border pl-3">
          <p className="text-xs text-muted-foreground mb-1">DELIVER TO:</p>
          <p className="font-bold text-sm leading-tight">
            {shipment.consignee?.name || shipment.customerName}
          </p>
          <p className="text-xs text-muted-foreground leading-tight mt-1">
            {shipment.consignee?.address || 'Address on file'}
          </p>
          <p className="text-xs font-mono mt-1">📞 {shipment.consignee?.phone || 'N/A'}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-muted-foreground border-t border-border pt-2">
        <span>{format(new Date(shipment.createdAt), 'dd MMM yyyy HH:mm')}</span>
        <span>{shipment.serviceLevel}</span>
        <span>www.tapancargo.com</span>
      </div>
    </div>
  );
}

// Print-optimized version
export function PrintableLabel({ shipment, packageIndex }: ShippingLabelProps) {
  return (
    <div className="print:block hidden">
      <style>{`
        @media print {
          @page { size: 4in 6in; margin: 0; }
          body { margin: 0; }
        }
      `}</style>
      <ShippingLabel shipment={shipment} packageIndex={packageIndex} />
    </div>
  );
}
