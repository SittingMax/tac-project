import { Link } from 'react-router-dom';
import { TacLogo } from '@/components/shared/tac-logo';

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-16 bg-muted/20 relative overflow-hidden rounded-none">
      <div className="absolute bottom-0 left-1/2 w-[800px] h-[400px] bg-primary/5 rounded-none blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2 space-y-6">
            <TacLogo size="lg" showSubtitle />
            <p className="text-muted-foreground text-sm font-mono max-w-sm leading-relaxed">
              Serving you with dedication for over 15 years. We proudly connect Imphal and New Delhi
              with reliable air, surface, pick-and-drop, and packing services. We look forward to
              expanding our services nationwide to serve you better.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-1">
            <h3 className="font-bold text-foreground mb-6 text-xs uppercase tracking-widest font-mono border-b border-border/40 pb-2">
              Platform
            </h3>
            <ul className="space-y-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <li>
                <a
                  href="#tracking"
                  className="hover:text-foreground transition-colors hover:pl-2 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Track Shipment
                </a>
              </li>
              <li>
                <a
                  href="#system-capabilities"
                  className="hover:text-foreground transition-colors hover:pl-2 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Capabilities
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="hover:text-foreground transition-colors hover:pl-2 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-bold text-foreground mb-6 text-xs uppercase tracking-widest font-mono border-b border-border/40 pb-2">
              Legal
            </h3>
            <ul className="space-y-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-foreground transition-colors hover:pl-2 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-foreground transition-colors hover:pl-2 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="font-bold text-foreground mb-6 text-xs uppercase tracking-widest font-mono border-b border-border/40 pb-2">
              Social
            </h3>
            <ul className="space-y-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <li>
                <a
                  href="#"
                  className="hover:text-foreground transition-colors hover:pl-2 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-foreground transition-colors hover:pl-2 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest text-center md:text-left">
            © {new Date().getFullYear()} Tapan Associate Cargo. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest text-center md:text-right">
            Dedicated to Serving You Better
          </p>
        </div>
      </div>
    </footer>
  );
}
