import HeroFinal from '@/components/landing-new/hero-final';
import { SystemCapabilities } from '@/components/landing-new/system-capabilities';
import { ContactSection } from '@/components/landing-new/contact-section';
import { TrackingSection } from '@/components/landing-new/tracking-section';
import { Footer } from '@/components/landing-new/footer';
import { TacBot } from '@/components/landing-new/tac-bot';
import { StatsCTA } from '@/components/landing-new/stats-cta';
import { ScrollProgress } from '@/components/motion/ScrollProgress';

export function Landing() {
  return (
    <div className="landing-theme min-h-screen bg-background font-sans text-foreground">
      <ScrollProgress />
      <main className="flex flex-col w-full">
        <HeroFinal />
        <TrackingSection />
        <SystemCapabilities />
        <StatsCTA />
        <ContactSection />
      </main>
      <Footer />
      <TacBot />
    </div>
  );
}
