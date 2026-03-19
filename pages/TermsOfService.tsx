import { LegalPageLayout, type LegalSection } from '@/components/layout/LegalPageLayout';

const termsSections: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: (
      <>
        <p>
          Welcome to the website of Tapan Associate Cargo Service ("Company", "we", "our", or "us").
          These Terms and Conditions govern the use of our website, logistics services, and cargo
          transportation operations.
        </p>
        <p>
          By accessing our website, booking shipments, or using any of our services, you agree to
          comply with and be legally bound by these Terms and Conditions.
        </p>
        <p>If you do not agree with any part of these Terms, you should not use our services.</p>
        <p className="font-semibold text-foreground mt-4">
          These Terms apply to all users including:
        </p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Consignors (senders)</li>
          <li>Consignees (receivers)</li>
          <li>Website visitors</li>
          <li>Business partners</li>
          <li>Service users</li>
        </ul>
      </>
    ),
  },
  {
    id: 'company-information',
    title: 'Company Information',
    content: (
      <>
        <p className="font-semibold text-foreground">Tapan Associate Cargo Service</p>
        <p>
          <strong>Head Office:</strong>
          <br />
          1498, Ground Floor, Wazir Nagar, Kotla Mubarakpur
          <br />
          Gali No. 3, New Delhi – 110003
        </p>
        <p>
          <strong>Branch Office:</strong>
          <br />
          Singjamei Thongam Leikai, Lane No. 6<br />
          Junction opposite Community Hall
          <br />
          Imphal West – 795008
        </p>
        <p>
          The company operates cargo transportation between Delhi, Manipur, and other serviceable
          locations.
        </p>
      </>
    ),
  },
  {
    id: 'scope-of-services',
    title: 'Scope of Services',
    content: (
      <>
        <p>Tapan Associate Cargo Service provides logistics services including:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Cargo transportation</li>
          <li>Parcel and package delivery</li>
          <li>Freight services</li>
          <li>Pickup and delivery arrangements</li>
          <li>Warehouse handling</li>
          <li>Cargo documentation</li>
          <li>Consignment tracking</li>
          <li>Cargo booking services</li>
        </ul>
        <p>Services are subject to operational availability and transportation conditions.</p>
        <p>
          The company reserves the right to modify, suspend, or discontinue any service without
          prior notice.
        </p>
      </>
    ),
  },
  {
    id: 'shipment-booking',
    title: 'Shipment Booking',
    content: (
      <>
        <p>A shipment is considered officially booked only when:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Shipment details are submitted</li>
          <li>Charges are confirmed</li>
          <li>A consignment number is generated</li>
        </ul>
        <p>Customers must provide accurate information including:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Sender details</li>
          <li>Receiver details</li>
          <li>Item description</li>
          <li>Declared value</li>
          <li>Weight and quantity</li>
          <li>Destination address</li>
        </ul>
        <p className="text-foreground font-medium border-l-2 border-primary pl-4 py-1 mt-6 bg-primary/5 rounded-r">
          Providing incorrect or misleading information may lead to cancellation or refusal of
          shipment.
        </p>
      </>
    ),
  },
  {
    id: 'prohibited-items',
    title: 'Prohibited Items',
    content: (
      <>
        <p>Customers are strictly prohibited from shipping the following items:</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>Illegal goods
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>Hazardous materials
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>Explosives
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>Weapons or ammunition
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>Narcotics or drugs
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>Flammable chemicals
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>Contraband goods
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>Counterfeit products
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>Restricted government
            items
          </li>
        </ul>
        <p>
          If any prohibited items are discovered, the consignor will be solely responsible for legal
          consequences.
        </p>
        <p>The company reserves the right to:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Refuse shipment</li>
          <li>Report the item to authorities</li>
          <li>Dispose of the item if required by law</li>
        </ul>
      </>
    ),
  },
  {
    id: 'packaging-responsibility',
    title: 'Packaging Responsibility',
    content: (
      <>
        <p>Proper packaging is the responsibility of the consignor.</p>
        <p>Shipments must be packed in a manner that:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Protects the item during transport</li>
          <li>Prevents leakage or damage</li>
          <li>Ensures safe handling</li>
        </ul>
        <p>Improper packaging may result in damage during transit.</p>
        <p className="text-foreground font-medium border-l-2 border-primary pl-4 py-1 mt-6 bg-primary/5 rounded-r">
          The company shall not be responsible for damage caused due to inadequate packaging.
        </p>
      </>
    ),
  },
  {
    id: 'fragile-items',
    title: 'Fragile & Electronic Items',
    content: (
      <>
        <p>Fragile items including:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Glass products</li>
          <li>Electronics</li>
          <li>Instruments</li>
          <li>Delicate goods</li>
        </ul>
        <p>are transported at owner's risk unless insured.</p>
        <p>Customers are encouraged to request special insurance coverage for valuable items.</p>
        <p>
          Without insurance coverage, compensation will be limited according to the company's
          liability terms.
        </p>
      </>
    ),
  },
  {
    id: 'freight-charges',
    title: 'Freight Charges',
    content: (
      <>
        <p>Shipping charges may include:</p>
        <ul className="grid grid-cols-2 gap-2 mt-2">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>Freight charges
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>Pickup charges
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>Packing charges
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>Documentation charges
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>Insurance fees
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>Handling charges
          </li>
        </ul>
        <p>Charges are determined based on:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Weight</li>
          <li>Volume</li>
          <li>Destination</li>
          <li>Item category</li>
        </ul>
        <p className="text-foreground font-medium border-l-2 border-primary pl-4 py-1 mt-6 bg-primary/5 rounded-r">
          All charges must be paid before shipment unless booked under To Pay basis.
        </p>
      </>
    ),
  },
  {
    id: 'delivery-policy',
    title: 'Delivery Policy',
    content: (
      <>
        <p>Deliveries are made to the destination office or the specified delivery address.</p>
        <p>Delivery timelines may vary depending on:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Transportation schedules</li>
          <li>Weather conditions</li>
          <li>Operational constraints</li>
          <li>Government regulations</li>
          <li>Logistics disruptions</li>
        </ul>
        <p className="text-foreground font-medium border-l-2 border-primary pl-4 py-1 mt-6 bg-primary/5 rounded-r">
          Estimated delivery times are indicative only and not guaranteed.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Liability for Damage or Loss',
    content: (
      <>
        <p>The company exercises reasonable care in handling shipments.</p>
        <p>However, liability for damage, loss, or delay shall be limited.</p>

        <div className="p-6 bg-primary/5 border border-primary/20 rounded-md my-6">
          <p className="font-semibold text-foreground m-0">
            Unless insured, compensation will not exceed:
          </p>
          <p className="font-mono text-lg text-primary mt-2">
            ₹50 per kg{' '}
            <span className="text-sm text-muted-foreground font-sans">
              or declared value (whichever is lower)
            </span>
          </p>
        </div>

        <p>The company shall not be liable for damages resulting from:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Natural disasters</li>
          <li>Accidents</li>
          <li>Delays due to authorities</li>
          <li>Improper packaging</li>
          <li>Hidden defects in goods</li>
          <li>Prohibited items shipped by the consignor</li>
        </ul>
      </>
    ),
  },
  {
    id: 'storage-charges',
    title: 'Storage & Godown Charges',
    content: (
      <>
        <p>Shipments arriving at the destination office must be collected within 7 days.</p>
        <p>If shipments remain uncollected:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Storage charges may apply</li>
          <li>Warehouse charges may be imposed</li>
        </ul>
        <p className="text-foreground font-medium border-l-2 border-primary pl-4 py-1 mt-6 bg-primary/5 rounded-r">
          After 21 days, godown charges may apply at ₹55 per day or applicable rates.
        </p>
      </>
    ),
  },
  {
    id: 'unclaimed-shipments',
    title: 'Unclaimed Shipments',
    content: (
      <>
        <p>Shipments that remain unclaimed for 45 days may be treated as abandoned.</p>
        <p>The company reserves the right to:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Auction</li>
          <li>Dispose</li>
          <li>Liquidate</li>
        </ul>
        <p>such shipments without further notice.</p>
        <p className="text-foreground font-medium border-l-2 border-primary pl-4 py-1 mt-6 bg-primary/5 rounded-r">
          After 100 days, the company may dispose of the consignment without liability.
        </p>
      </>
    ),
  },
  {
    id: 'shipment-tracking',
    title: 'Shipment Tracking',
    content: (
      <>
        <p>Shipment tracking services may be available through:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Website</li>
          <li>Customer support</li>
          <li>Consignment number</li>
        </ul>
        <p>
          Tracking updates are provided for convenience but may not always reflect real-time status.
        </p>
      </>
    ),
  },
  {
    id: 'cancellation',
    title: 'Cancellation and Refunds',
    content: (
      <>
        <p>Shipment bookings may be cancelled before dispatch.</p>
        <p>Refund eligibility depends on:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Booking status</li>
          <li>Operational expenses incurred</li>
          <li>Cancellation timing</li>
        </ul>
        <p>Refunds may be processed after administrative deductions.</p>
      </>
    ),
  },
  {
    id: 'limitation',
    title: 'Limitation of Liability',
    content: (
      <>
        <p>Tapan Associate Cargo Service shall not be liable for:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Indirect losses</li>
          <li>Business losses</li>
          <li>Consequential damages</li>
          <li>Lost profits</li>
          <li>Loss of business opportunity</li>
        </ul>
        <p className="text-foreground font-medium border-l-2 border-primary pl-4 py-1 mt-6 bg-primary/5 rounded-r">
          Liability is limited to the value declared during booking.
        </p>
      </>
    ),
  },
  {
    id: 'force-majeure',
    title: 'Force Majeure',
    content: (
      <>
        <p>
          The company shall not be liable for service interruptions caused by events beyond its
          control including:
        </p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Natural disasters</li>
          <li>War</li>
          <li>Strikes</li>
          <li>Government restrictions</li>
          <li>Pandemics</li>
          <li>Transport disruptions</li>
        </ul>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: (
      <>
        <p>These Terms shall be governed by the laws of India.</p>
        <p>All disputes shall fall under the jurisdiction of courts in Delhi.</p>
      </>
    ),
  },
];

export function TermsOfService() {
  const effectiveDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <LegalPageLayout
      title="Terms and Conditions"
      effectiveDate={effectiveDate}
      sections={termsSections}
    />
  );
}
