import { LegalPageLayout, type LegalSection } from '@/components/layout/LegalPageLayout';

const privacySections: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: (
      <>
        <p>
          Tapan Associate Cargo Service respects your privacy and is committed to protecting your
          personal data.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, store, and protect your information when
          you use our services or website.
        </p>
        <p className="font-semibold text-foreground mt-4">
          This policy is designed in accordance with:
        </p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Information Technology Act, 2000</li>
          <li>Information Technology (Reasonable Security Practices and Procedures) Rules, 2011</li>
          <li>Applicable Indian data protection guidelines.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    content: (
      <>
        <p>We may collect the following information:</p>

        <h3 className="text-lg font-bold text-foreground mt-8 mb-4 border-b border-border/40 pb-2">
          Personal Information
        </h3>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Name</li>
          <li>Phone number</li>
          <li>Email address</li>
          <li>Pickup address</li>
          <li>Delivery address</li>
          <li>Government identification (if required)</li>
        </ul>

        <h3 className="text-lg font-bold text-foreground mt-8 mb-4 border-b border-border/40 pb-2">
          Shipment Information
        </h3>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Package description</li>
          <li>Weight and quantity</li>
          <li>Declared value</li>
          <li>Delivery instructions</li>
        </ul>

        <h3 className="text-lg font-bold text-foreground mt-8 mb-4 border-b border-border/40 pb-2">
          Technical Information
        </h3>
        <p>When using the website we may collect:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2 mt-2">
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Usage statistics</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    content: (
      <>
        <p>Your information may be used to:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Process shipment bookings</li>
          <li>Manage cargo deliveries</li>
          <li>Generate invoices</li>
          <li>Provide shipment tracking</li>
          <li>Communicate shipment updates</li>
          <li>Improve service quality</li>
          <li>Prevent fraud or misuse</li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing',
    content: (
      <>
        <p className="text-foreground font-medium border-l-2 border-primary pl-4 py-1 mb-6 bg-primary/5 rounded-r">
          We do not sell personal data.
        </p>
        <p>However, information may be shared with:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Transportation partners</li>
          <li>Delivery personnel</li>
          <li>Regulatory authorities</li>
          <li>Law enforcement agencies (if required by law)</li>
        </ul>
        <p className="mt-4">
          Data sharing occurs only when necessary to provide logistics services.
        </p>
      </>
    ),
  },
  {
    id: 'data-security',
    title: 'Data Security',
    content: (
      <>
        <p>We implement industry-standard security practices including:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Secure server storage</li>
          <li>Data encryption</li>
          <li>Access control systems</li>
          <li>Internal data protection policies</li>
        </ul>
        <p className="italic text-sm mt-4 opacity-80">
          Despite these measures, no system is completely secure.
        </p>
      </>
    ),
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    content: (
      <>
        <p>Customer information may be stored for:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Legal compliance</li>
          <li>Accounting purposes</li>
          <li>Shipment dispute resolution</li>
        </ul>
        <p className="mt-4">Records may be retained for a reasonable period as required by law.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies & Tracking',
    content: (
      <>
        <p>Our website may use cookies to:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Improve user experience</li>
          <li>Analyze website traffic</li>
          <li>Maintain session information</li>
        </ul>
        <p className="mt-4">Users may disable cookies through browser settings.</p>
      </>
    ),
  },
  {
    id: 'user-rights',
    title: 'User Rights',
    content: (
      <>
        <p>Customers may request:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Access to their personal data</li>
          <li>Correction of incorrect information</li>
          <li>Deletion of personal records (where legally permissible)</li>
        </ul>
        <p className="mt-4">Requests may be submitted to the company's contact details.</p>
      </>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-Party Links',
    content: (
      <>
        <p>Our website may contain links to external websites.</p>
        <p>We are not responsible for the privacy practices of third-party websites.</p>
      </>
    ),
  },
  {
    id: 'policy-updates',
    title: 'Policy Updates',
    content: (
      <>
        <p>This Privacy Policy may be updated periodically to reflect:</p>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Legal changes</li>
          <li>Service improvements</li>
          <li>Security updates</li>
        </ul>
        <p className="mt-4 border-l-2 border-primary pl-4 py-1 bg-primary/5 rounded-r">
          Updated policies will be published on the website.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Information',
    content: (
      <div className="flex flex-col gap-4 p-6 bg-muted/20 border border-border/50 rounded-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
        <p className="font-bold text-foreground mb-6 text-lg tracking-tight">
          Tapan Associate Cargo Service
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div>
            <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground mb-2 block">
              New Delhi Office
            </span>
            <address className="not-italic text-sm leading-relaxed">
              1498, Wazir Nagar, Kotla Mubarakpur
              <br />
              New Delhi – 110003
            </address>
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground mb-2 block">
              Imphal Branch
            </span>
            <address className="not-italic text-sm leading-relaxed">
              Singjamei Thongam Leikai
              <br />
              Imphal West – 795008
            </address>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row gap-6 relative z-10">
          <div>
            <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground mb-1 block">
              Phone Support
            </span>
            <div className="flex flex-col gap-1">
              <a
                href="tel:+919873530487"
                className="font-mono hover:text-primary transition-colors"
              >
                +91 98735 30487
              </a>
              <a
                href="tel:+916909383936"
                className="font-mono hover:text-primary transition-colors"
              >
                +91 69093 83936
              </a>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export function PrivacyPolicy() {
  const effectiveDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <LegalPageLayout
      title="Privacy Policy"
      effectiveDate={effectiveDate}
      sections={privacySections}
    />
  );
}
