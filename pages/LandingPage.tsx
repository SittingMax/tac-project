import HeroFinal from '@/components/landing-new/hero-final';
import { SystemCapabilities } from '@/components/landing-new/system-capabilities';
import { GlobalFleet } from '@/components/landing-new/global-fleet';
import { ContactSection } from '@/components/landing-new/contact-section';
import { TrackingSection } from '@/components/landing-new/tracking-section';
import { Footer } from '@/components/landing-new/footer';
import { TacBot } from '@/components/landing-new/tac-bot';

export function Landing() {
  return (
    <div className="landing-theme min-h-screen bg-background font-sans text-foreground">
      <main className="flex flex-col w-full">
        <HeroFinal />
        <TrackingSection />
        <SystemCapabilities />
        <GlobalFleet />
        <ContactSection />
      </main>
      <Footer />
      <TacBot />
    </div>
  );
}
