'use client';

import { ArrowRight, Package, Clock, ShieldCheck } from 'lucide-react';
import { motion } from '@/lib/motion';
import { HUBS, SHIPMENT_MODES, SERVICE_LEVELS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { TextReveal } from '@/components/motion/TextReveal';
import { FadeUp } from '@/components/motion/FadeUp';
import { StaggerChildren } from '@/components/motion/StaggerChildren';
import { CountUp } from '@/components/motion/CountUp';
import { LottieSlot } from './lottie-slot';

export function StatsCTA() {
  return (
    <section className="relative w-full overflow-hidden py-16 lg:py-24 bg-background border-t border-border/50">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between text-left">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-6 shadow-[inset_0_1px_0_0_oklch(100%_0_0deg/0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              /// IMPACT_METRICS
            </div>
            <TextReveal
              text="Operational Coverage"
              as="h2"
              className="block w-full text-left text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground mb-6"
            />
            <FadeUp delay={0.3}>
              <p className="text-muted-foreground text-lg sm:text-xl font-light max-w-2xl leading-relaxed [text-wrap:balance]">
                Real service options across{' '}
                <span className="text-foreground font-medium">Imphal</span> and{' '}
                <span className="text-foreground font-medium">New Delhi</span>, with supported
                freight modes and delivery tiers reflected directly in the platform.
              </p>
            </FadeUp>
          </div>

          <FadeUp delay={0.4} className="shrink-0">
            <a href="#contact" className="inline-flex">
              <Button
                size="lg"
                className="h-14 rounded-md px-10 text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 bg-primary text-primary-foreground hover:bg-primary/90 group"
              >
                Get a Quote
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
          </FadeUp>
        </div>

        <StaggerChildren className="grid gap-8 md:grid-cols-3" staggerDelay={0.15}>
          {/* Stat 1 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
            className="group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-md p-10 text-center hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>

            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm relative overflow-hidden">
                <LottieSlot
                  src="/lottie/rising-bar-chart .json"
                  className="w-12 h-12 relative z-10"
                  fallbackIcon={<Package className="w-8 h-8 relative z-10" />}
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/50 transition-colors z-0"></div>
              </div>
              <div className="text-5xl lg:text-6xl font-extrabold text-foreground mb-3 tracking-tighter font-mono tabular-nums">
                <CountUp to={Object.keys(HUBS).length} duration={2.5} />
              </div>
              <p className="text-muted-foreground font-semibold text-sm uppercase tracking-widest group-hover:text-foreground transition-colors [text-wrap:balance]">
                Operational Hubs
              </p>
            </div>
            {/* Corner Accent Label */}
            <div className="absolute top-4 right-4 font-mono text-[10px] text-muted-foreground/50 tracking-widest font-bold">
              OBJ_01
            </div>
          </motion.div>

          {/* Stat 2 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
            className="group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-md p-10 text-center hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>

            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm relative overflow-hidden">
                <ShieldCheck className="w-8 h-8 relative z-10" />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/50 transition-colors z-0"></div>
              </div>
              <div className="text-5xl lg:text-6xl font-extrabold text-foreground mb-3 tracking-tighter font-mono tabular-nums">
                <CountUp to={SHIPMENT_MODES.length} duration={2.5} />
              </div>
              <p className="text-muted-foreground font-semibold text-sm uppercase tracking-widest group-hover:text-foreground transition-colors [text-wrap:balance]">
                Freight Modes Supported
              </p>
            </div>
            <div className="absolute top-4 right-4 font-mono text-[10px] text-muted-foreground/50 tracking-widest font-bold">
              OBJ_02
            </div>
          </motion.div>

          {/* Stat 3 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
            className="group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-md p-10 text-center hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>

            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm relative overflow-hidden">
                <Clock className="w-8 h-8 relative z-10" />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/50 transition-colors z-0"></div>
              </div>
              <div className="text-5xl lg:text-6xl font-extrabold text-foreground mb-3 tracking-tighter font-mono tabular-nums">
                <CountUp to={SERVICE_LEVELS.length} duration={2.5} />
              </div>
              <p className="text-muted-foreground font-semibold text-sm uppercase tracking-widest group-hover:text-foreground transition-colors [text-wrap:balance]">
                Service Levels Offered
              </p>
            </div>
            <div className="absolute top-4 right-4 font-mono text-[10px] text-muted-foreground/50 tracking-widest font-bold">
              OBJ_03
            </div>
          </motion.div>
        </StaggerChildren>
      </div>
    </section>
  );
}
