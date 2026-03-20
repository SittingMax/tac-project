import { MapPin, ShieldCheck, Zap } from 'lucide-react';
import { FadeUp } from '@/components/motion/FadeUp';
import { TextReveal } from '@/components/motion/TextReveal';
import { LottieSlot } from './lottie-slot';

export function TrackingSection() {
  return (
    <section
      id="tracking-ecosystem"
      className="py-16 lg:py-24 bg-background text-foreground relative overflow-hidden"
    >
      {/* Background Subtle Glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Story & Metrics */}
          <FadeUp className="flex flex-col">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-3 py-1 backdrop-blur-md self-start">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Live Custody Chain
              </span>
            </div>
            
            <TextReveal
              as="h2"
              text="End-to-End Visibility"
              className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tighter"
            />
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
              Every shipment is actively monitored across air and surface networks. Our digital logs update instantly, so you never have to guess where your cargo is.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Real-Time Routing</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Active rerouting based on global weather and traffic patterns.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Secure Custody Log</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Immutable digital signatures at every handover point.</p>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Right Column: Visual Elements */}
          <FadeUp delay={0.2} className="relative h-full flex flex-col justify-center">
            <div className="relative p-8 glass-panel bg-card/10 border-border/40 shadow-2xl rounded-2xl overflow-hidden aspect-video flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent transition-opacity group-hover:opacity-100 opacity-50"></div>
              
              <LottieSlot
                src="/lottie/dotted A→B route.json"
                className="w-3/4 max-w-[400px] max-h-[80%] object-contain opacity-90 mix-blend-plus-lighter drop-shadow-lg"
                fallbackIcon={<MapPin className="h-10 w-10 text-primary opacity-50" />}
              />
              
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 dark:ring-white/5"></div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
