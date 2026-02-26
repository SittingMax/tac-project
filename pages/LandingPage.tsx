import { Navbar } from '@/components/landing-new/navbar';
import { HeroSection } from '@/components/landing-new/hero-section';
import { SystemCapabilities } from '@/components/landing-new/system-capabilities';
import { GlobalFleet } from '@/components/landing-new/global-fleet';
import { About } from '@/components/landing-new/about';
import { StatsCTA } from '@/components/landing-new/stats-cta';
import { ContactSection } from '@/components/landing-new/contact-section';
import { SystemTicker } from '@/components/landing-new/system-ticker';
import { TrackingSection } from '@/components/landing-new/tracking-section';
import { TrustedBy } from '@/components/landing-new/trusted-by';
import { Footer } from '@/components/landing-new/footer';
import { TacBot } from '@/components/landing-new/tac-bot';
import { ScrollProgress } from '@/components/motion/ScrollProgress';

export function Landing() {
  return (
    <div className="landing-theme min-h-screen bg-background font-sans text-foreground overflow-x-hidden relative">
      <ScrollProgress />
      <Navbar />
      <main className="flex flex-col w-full">
        <HeroSection />
        <SystemTicker />
        <TrackingSection />
        <TrustedBy />
        <SystemCapabilities />
        <GlobalFleet />
        <About />
        <StatsCTA />
        <ContactSection />
      </main>
      <Footer />
      <TacBot />
    </div>
  );
}
