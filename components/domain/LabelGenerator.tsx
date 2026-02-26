import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UniversalBarcode } from '@/components/barcodes';

export type ServiceLevel = 'STANDARD' | 'EXPRESS' | 'PRIORITY';
export type TransportMode = 'AIR' | 'TRUCK';

export interface LabelData {
  awb: string;
  transportMode: TransportMode;
  serviceLevel: ServiceLevel;
  serviceName: string;
  serviceCode: string;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  paymentMode: string;
  recipient: {
    name: string;
    address: string;
    city: string;
    state?: string;
  };
  routing: {
    origin: string;
    destination: string;
    deliveryStation: string;
    originSort: string;
    destSort: string;
  };
  dates: {
    shipDate: string;
    invoiceDate: string;
  };
  gstNumber?: string;
}

interface LabelGeneratorProps {
  data: LabelData;
  onPrint?: () => void;
}

const TransportIcon: React.FC<{ mode: TransportMode; className?: string }> = ({
  mode,
  className = 'w-5 h-5',
}) => {
  if (mode === 'AIR') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 576 512"
        className={className}
        fill="currentColor"
      >
        <path d="M480 192H365.71L260.61 8.06A16.014 16.014 0 0 0 246.71 0h-65.5c-10.63 0-18.3 10.17-15.38 20.39L214.86 192H112l-43.2-57.6c-3.02-4.03-7.77-6.4-12.8-6.4H16.01C5.6 128-2.04 137.78.49 147.88L32 256L.49 364.12C-2.04 374.22 5.6 384 16.01 384H56c5.04 0 9.78-2.37 12.8-6.4L112 320h102.86l-49.03 171.6c-2.92 10.22 4.75 20.4 15.38 20.4h65.5c5.74 0 11.04-3.08 13.89-8.06L365.71 320H480c35.35 0 96-28.65 96-64s-60.65-64-96-64z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M3 13.5L2.25 12H7.5l-.6-1.5H2L1.25 9h7.8l-.6-1.5H1.11L.25 6H4a2 2 0 0 1 2-2h12v4h3l3 4v5h-2a3 3 0 0 1-3 3a3 3 0 0 1-3-3h-4a3 3 0 0 1-3 3a3 3 0 0 1-3-3H4v-3.5H3m16 5a1.5 1.5 0 0 0 1.5-1.5a1.5 1.5 0 0 0-1.5-1.5a1.5 1.5 0 0 0-1.5 1.5a1.5 1.5 0 0 0 1.5 1.5m1.5-9H18V12h4.46L20.5 9.5M9 18.5a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 9 15.5A1.5 1.5 0 0 0 7.5 17A1.5 1.5 0 0 0 9 18.5Z" />
    </svg>
  );
};

export const LabelGenerator: React.FC<LabelGeneratorProps> = ({ data, onPrint }) => {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="label-page-root">
      {/* Print Controls */}
      <div className="label-toolbar print:hidden">
        <Button onClick={handlePrint} size="sm">
          <Printer className="w-4 h-4 mr-2" /> Print Label
        </Button>
      </div>

      {/* Label */}
      <div ref={labelRef} className="label-container">
        <style>{`
          /* ===== PAGE SETUP ===== */
          .label-page-root {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 16px;
            min-height: 100vh;
            background: #f4f4f5;
          }

          .label-toolbar {
            display: flex;
            justify-content: flex-end;
            width: 100%;
            max-width: 384px;
          }

          .label-container {
            width: 384px;
            max-width: 100%;
          }

          /* ===== LABEL CARD ===== */
          .sl {
            width: 384px;
            background: #fff;
            border: 2px solid #18181b;
            font-family: 'Inter', Arial, Helvetica, sans-serif;
            color: #18181b;
            font-size: 11px;
            line-height: 1.3;
          }

          /* ===== HEADER BAR (dark) ===== */
          .sl-header {
            background: #18181b;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 12px;
          }
          .sl-brand {
            font-weight: 800;
            font-size: 14px;
            letter-spacing: 2px;
          }
          .sl-service-tag {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .sl-service-tag svg { width: 14px; height: 14px; }

          /* ===== BARCODE + META ROW ===== */
          .sl-barcode-row {
            display: grid;
            grid-template-columns: 1fr 110px;
            border-bottom: 1.5px solid #18181b;
          }
          .sl-barcode-cell {
            padding: 10px 12px 6px;
            border-right: 1.5px solid #18181b;
          }
          .sl-barcode {
            width: 100%;
            height: 40px;
            background: repeating-linear-gradient(
              90deg,
              #18181b 0px, #18181b 2px,
              transparent 2px, transparent 4px,
              #18181b 4px, #18181b 5px,
              transparent 5px, transparent 7px,
              #18181b 7px, #18181b 9px,
              transparent 9px, transparent 11px
            );
            margin-bottom: 4px;
          }
          .sl-awb {
            font-size: 15px;
            font-weight: 900;
            font-family: 'Courier New', monospace;
            letter-spacing: 0.5px;
          }

          .sl-meta-cell {
            display: flex;
            flex-direction: column;
          }
          .sl-meta-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px;
            flex: 1;
            border-bottom: 1.5px solid #18181b;
          }
          .sl-meta-icon svg { width: 28px; height: 28px; }
          .sl-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
          .sl-meta-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4px 2px;
            text-align: center;
          }
          .sl-meta-item:first-child {
            border-right: 1.5px solid #18181b;
          }
          .sl-meta-val {
            font-size: 14px;
            font-weight: 900;
            line-height: 1.2;
          }
          .sl-meta-unit {
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            color: #71717a;
          }

          /* ===== PAYMENT BAR ===== */
          .sl-paybar {
            background: #18181b;
            color: #fff;
            text-align: center;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: 3px 0;
            border-bottom: 1.5px solid #18181b;
          }

          /* ===== SHIP TO ===== */
          .sl-shipto {
            padding: 10px 12px;
            border-bottom: 1.5px solid #18181b;
          }
          .sl-kicker {
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #71717a;
            margin: 0 0 3px 0;
          }
          .sl-recipient-name {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            line-height: 1.15;
            margin: 0 0 4px 0;
            word-break: break-word;
          }
          .sl-address {
            font-size: 11px;
            font-weight: 500;
            line-height: 1.4;
            margin: 0;
            color: #3f3f46;
          }

          /* ===== ROUTE STRIP ===== */
          .sl-route-strip {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            border-bottom: 1.5px solid #18181b;
            min-height: 64px;
          }
          .sl-hub {
            padding: 8px 12px;
            text-align: center;
          }
          .sl-hub-code {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: 1px;
            margin: 0;
            line-height: 1;
          }
          .sl-hub-name {
            font-size: 9px;
            font-weight: 600;
            color: #71717a;
            margin: 2px 0 0 0;
            text-transform: uppercase;
          }
          .sl-route-arrow {
            font-size: 20px;
            font-weight: 300;
            color: #a1a1aa;
            padding: 0 4px;
          }

          /* ===== DETAILS GRID ===== */
          .sl-details {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            border-bottom: 1.5px solid #18181b;
          }
          .sl-detail-cell {
            padding: 8px 10px;
            border-right: 1.5px solid #18181b;
          }
          .sl-detail-cell:last-child {
            border-right: 0;
          }
          .sl-detail-val {
            font-size: 12px;
            font-weight: 800;
            margin: 2px 0 0 0;
          }

          /* ===== SERVICE + SORT ROW ===== */
          .sl-bottom-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            border-bottom: 1.5px solid #18181b;
          }
          .sl-sort-cell {
            padding: 8px 10px;
            border-right: 1.5px solid #18181b;
            text-align: center;
          }
          .sl-sort-cell:last-child { border-right: 0; }
          .sl-sort-code {
            font-size: 20px;
            font-weight: 900;
            margin: 2px 0 0 0;
            line-height: 1;
          }

          /* ===== FOOTER ===== */
          .sl-footer {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 6px 12px;
            background: #fafafa;
          }
          .sl-footer-badge {
            width: 22px;
            height: 22px;
            border: 2px solid #18181b;
            border-radius: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 11px;
          }
          .sl-footer-text {
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 1px;
          }

          /* ===== PRINT STYLES ===== */
          @media print {
            body * { visibility: hidden; }
            .label-page-root { background: white !important; padding: 0 !important; }
            .label-toolbar { display: none !important; }
            .label-container,
            .label-container * { visibility: visible; }
            .label-container {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        `}</style>

        <main className="sl">
          {/* HEADER BAR */}
          <header className="sl-header">
            <span className="sl-brand">TAC</span>
            <span className="sl-service-tag">
              <TransportIcon mode={data.transportMode} />
              {data.serviceName}
            </span>
          </header>

          {/* BARCODE + META */}
          <section className="sl-barcode-row">
            <div className="sl-barcode-cell">
              <div className="sl-barcode flex items-center justify-start overflow-hidden">
                <UniversalBarcode value={data.awb} mode="print" className="max-w-full" />
              </div>
              <div className="sl-awb">{data.awb}</div>
            </div>
            <div className="sl-meta-cell">
              <div className="sl-meta-icon">
                <TransportIcon mode={data.transportMode} />
              </div>
              <div className="sl-meta-grid">
                <div className="sl-meta-item">
                  <span className="sl-meta-val">{Number(data.weight || 0).toFixed(1)}</span>
                  <span className="sl-meta-unit">{data.weightUnit}</span>
                </div>
                <div className="sl-meta-item">
                  <span className="sl-meta-val">{data.serviceCode}</span>
                  <span className="sl-meta-unit">svc</span>
                </div>
              </div>
            </div>
          </section>

          {/* PAYMENT BAR */}
          <div className="sl-paybar">{data.paymentMode}</div>

          {/* SHIP TO */}
          <section className="sl-shipto">
            <p className="sl-kicker">Ship To</p>
            <h1 className="sl-recipient-name">{data.recipient.name}</h1>
            <p className="sl-address">
              {data.recipient.address && (
                <>
                  {data.recipient.address}
                  <br />
                </>
              )}
              {data.recipient.city}
              {data.recipient.state && <>, {data.recipient.state}</>}
            </p>
          </section>

          {/* ROUTE STRIP */}
          <section className="sl-route-strip">
            <div className="sl-hub">
              <p className="sl-hub-code">{data.routing.origin}</p>
              <p className="sl-hub-name">Origin</p>
            </div>
            <span className="sl-route-arrow">→</span>
            <div className="sl-hub">
              <p className="sl-hub-code">{data.routing.destination}</p>
              <p className="sl-hub-name">Destination</p>
            </div>
          </section>

          {/* DETAILS */}
          <section className="sl-details">
            <div className="sl-detail-cell">
              <p className="sl-kicker">Ship Date</p>
              <p className="sl-detail-val">{data.dates.shipDate}</p>
            </div>
            <div className="sl-detail-cell">
              <p className="sl-kicker">GST No.</p>
              <p className="sl-detail-val" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                {data.gstNumber || 'N/A'}
              </p>
            </div>
            <div className="sl-detail-cell">
              <p className="sl-kicker">Invoice Date</p>
              <p className="sl-detail-val">{data.dates.invoiceDate}</p>
            </div>
          </section>

          {/* SORT / DELIVERY */}
          <section className="sl-bottom-row">
            <div className="sl-sort-cell">
              <p className="sl-kicker">Delivery Stn</p>
              <p className="sl-sort-code">{data.routing.deliveryStation}</p>
            </div>
            <div className="sl-sort-cell">
              <p className="sl-kicker">Origin Sort</p>
              <p className="sl-sort-code">{data.routing.originSort}</p>
            </div>
            <div className="sl-sort-cell">
              <p className="sl-kicker">Dest Sort</p>
              <p className="sl-sort-code">{data.routing.destSort}</p>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="sl-footer">
            <span className="sl-footer-text">TAC Logistics</span>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default LabelGenerator;
