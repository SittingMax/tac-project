import { Link } from 'react-router-dom';
import { TacLogo } from '@/components/shared/tac-logo';
import { Linkedin, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-16 bg-muted/20 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <TacLogo size="lg" showSubtitle />
            <p className="text-muted-foreground text-sm font-mono max-w-sm leading-loose">
              Serving you with dedication for over 15 years. We proudly connect Imphal and New Delhi
              with reliable air, surface, pick-and-drop, and packing services. We look forward to
              expanding our services nationwide to serve you better.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-1 lg:col-span-1">
            <h3 className="font-bold text-foreground mb-6 text-xs uppercase tracking-widest font-mono border-b border-border/40 pb-2">
              Platform
            </h3>
            <ul className="flex flex-col gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <li>
                <a
                  href="#tracking"
                  className="opacity-70 hover:opacity-100 hover:text-foreground transition relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Track Shipment
                </a>
              </li>
              <li>
                <a
                  href="#system-capabilities"
                  className="opacity-70 hover:opacity-100 hover:text-foreground transition relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Capabilities
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="opacity-70 hover:opacity-100 hover:text-foreground transition relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <h3 className="font-bold text-foreground mb-6 text-xs uppercase tracking-widest font-mono border-b border-border/40 pb-2">
              Legal
            </h3>
            <ul className="flex flex-col gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <li>
                <Link
                  to="/privacy"
                  className="opacity-70 hover:opacity-100 hover:text-foreground transition relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="opacity-70 hover:opacity-100 hover:text-foreground transition relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <h3 className="font-bold text-foreground mb-6 text-xs uppercase tracking-widest font-mono border-b border-border/40 pb-2">
              Social
            </h3>
            <ul className="flex flex-col gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <li>
                <a
                  href="#"
                  className="opacity-70 hover:opacity-100 hover:text-foreground transition flex items-center gap-2 group w-fit"
                >
                  <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/30 transition">
                    <Linkedin size={12} strokeWidth={1.5} />
                  </div>
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="opacity-70 hover:opacity-100 hover:text-foreground transition flex items-center gap-2 group w-fit"
                >
                  <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/30 transition">
                    <Twitter size={12} strokeWidth={1.5} />
                  </div>
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 mt-2 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs text-center md:text-left">
            © {new Date().getFullYear()} Tapan Associate Cargo. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs text-center md:text-right">
            Dedicated to Serving You Better
          </p>
        </div>
      </div>
    </footer>
  );
}
