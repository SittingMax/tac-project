import { Link } from 'react-router-dom';
import { Box } from 'lucide-react';
import { StaggerChildren } from '@/components/motion/StaggerChildren';
import { FadeUp } from '@/components/motion/FadeUp';
import { motion } from '@/lib/motion';
import { Badge } from '@/components/ui/badge';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-20 pb-10">
      <div className="container mx-auto max-w-7xl px-6">
        <StaggerChildren
          className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16"
          staggerDelay={0.1}
        >
          {/* Brand */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="md:col-span-4 lg:col-span-5"
          >
            <Link to="/" className="flex items-center gap-3 mb-6 group w-fit">
              <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary text-primary-foreground font-bold transition-all duration-300 group-hover:scale-110 shadow-lg shadow-primary/20">
                <Box className="h-6 w-6 fill-current" />
              </div>
              <span className="text-foreground text-xl font-sans font-bold tracking-tight">
                TAC
              </span>
            </Link>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm mb-8">
              Advanced logistics for the modern world. Connecting the Northeast corridor with precision, speed, and unwavering reliability.
            </p>
            <div className="flex gap-4">{/* Social placeholders could go here */}</div>
          </motion.div>

          {/* Links Column 1 */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="md:col-span-2 lg:col-span-2 lg:col-start-7"
          >
            <h3 className="font-sans font-bold text-foreground mb-6">Platform</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/#tracking"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Tracking
                </Link>
              </li>
              <li>
                <Link
                  to="/#services"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  to="/#pricing"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Links Column 2 */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="md:col-span-2 lg:col-span-2"
          >
            <h3 className="font-sans font-bold text-foreground mb-6">Company</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/about"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Links Column 3 */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="md:col-span-2 lg:col-span-2"
          >
            <h3 className="font-sans font-bold text-foreground mb-6">Legal</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </motion.div>
        </StaggerChildren>

        <FadeUp
          delay={0.4}
          className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} TAC. All rights reserved.
          </p>
          <Badge
            variant="secondary"
            className="gap-3 px-4 py-2 rounded-none border border-border/50"
          >
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              System Status
            </span>
            <span className="flex items-center gap-1.5 text-status-live font-bold text-xs">
              <span className="w-2 h-2 rounded-none bg-current animate-pulse shadow-[0_0_8px_currentColor]"></span>
              OPTIMAL
            </span>
          </Badge>
        </FadeUp>
      </div>
    </footer>
  );
}
