import React, { useMemo } from 'react';
import { UniversalBarcode } from '@/components/barcodes';
import './shipping-label.css';

// Interface for the view model expected by this component
export interface ShippingLabelData {
  serviceName: string;
  tracking: string;
  weight: string;
  serviceType: string;
  payment: string;
  mode: 'AIR' | 'TRUCK'; // Transport mode for icon selection
  shipToName: string;
  shipToLines: string[];
  deliveryStation: string;
  originSort: string;
  destSort: string;
  shipDate: string;
  gstNumber: string;
  invoiceDate: string;
  routingFrom: string;
  routingTo: string;
  serviceLevel: string;
  contents: string;
  qty: string;
  footerLeft: string[];
  brand: string;
}

export const ShippingLabel: React.FC<{ shipment: ShippingLabelData }> = ({ shipment }) => {
  const shipToBlock = useMemo(() => shipment.shipToLines || [], [shipment.shipToLines]);

  return (
    <div className="labelWrap">
      <div className="label" id="shipping-label">
        {/* HEADER */}
        <div className="row header">
          <div className="cell">
            <div className="kicker">{shipment.serviceName}</div>

            <UniversalBarcode
              value={shipment.tracking}
              mode="print"
              displayValue={false}
              width={2}
              height={50}
            />

            <div className="mid mono">{shipment.tracking}</div>
          </div>

          <div className="rightHeader">
            <div className="truckBox">
              {shipment.mode === 'AIR' ? (
                <img src="/plane-label.svg" alt="Air Cargo" className="modeIcon" />
              ) : (
                <img src="/truck-label.svg" alt="Surface Cargo" className="modeIcon" />
              )}
            </div>

            <div className="meta2">
              <div className="cell center">{shipment.weight}</div>
              <div className="cell center thin-left">{shipment.serviceType}</div>
            </div>

            <div className="toPay">{shipment.payment}</div>
          </div>
        </div>

        {/* SHIP TO */}
        <div className="cell shipto">
          <div className="kicker">SHIP TO</div>
          <div className="name">{shipment.shipToName}</div>
          <div className="addr">
            {shipToBlock.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>

        {/* STATIONS */}
        <div className="row stations">
          <Station label="DELIVERY STATION" code={shipment.deliveryStation} />
          <Station label="ORIGIN SORT" code={shipment.originSort} />
          <Station label="DEST SORT" code={shipment.destSort} last />
        </div>

        {/* META */}
        <div className="row meta3">
          <Meta label="SHIP DATE" value={shipment.shipDate} />
          <Meta label="GST NUMBER" value={shipment.gstNumber} mono />
          <Meta label="INVOICE DATE" value={shipment.invoiceDate} last />
        </div>

        {/* ROUTING + SERVICE */}
        <div className="row routingRow">
          <div className="cell">
            <div className="kicker">ROUTING</div>
            <div className="arrow">
              <span>{shipment.routingFrom}</span>
              <span className="sep">→</span>
              <span>{shipment.routingTo}</span>
            </div>
          </div>

          <div className="cell">
            <div className="kicker">SERVICE LEVEL</div>
            <div className="serviceBox">{shipment.serviceLevel}</div>
          </div>
        </div>

        {/* CONTENTS */}
        <div className="row contentsRow">
          <div className="cell">
            <div className="kicker">CONTENTS</div>
            <div className="contentsValue">{shipment.contents}</div>
          </div>
          <div className="cell">
            <div className="kicker right">QTY</div>
            <div className="qtyValue">{shipment.qty}</div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="footer">
          <div className="legal">
            {shipment.footerLeft.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
          <div className="brand">
            <span className="brandMark" aria-hidden="true" />
            <span>{shipment.brand}</span>
          </div>
        </div>
      </div>

      {/* Optional print CTA */}
      <div className="controls no-print">
        <button className="btn" onClick={() => window.print()} type="button">
          Print Label (4x6)
        </button>
      </div>
    </div>
  );
};

const Station: React.FC<{ label: string; code: string; last?: boolean }> = ({
  label,
  code,
  last,
}) => {
  return (
    <div className={`cell ${last ? '' : 'thin-right'}`}>
      <div className="kicker">{label}</div>
      <div className="code">{code}</div>
    </div>
  );
};

const Meta: React.FC<{ label: string; value: string; mono?: boolean; last?: boolean }> = ({
  label,
  value,
  mono,
  last,
}) => {
  return (
    <div className={`cell metaCell ${last ? '' : 'thin-right'}`}>
      <div className="kicker">{label}</div>
      <div className={`metaValue ${mono ? 'mono' : ''}`}>{value}</div>
    </div>
  );
};
