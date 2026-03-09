'use client';

import { ArrowRight, Package, Clock, ShieldCheck } from 'lucide-react';
import { motion } from '@/lib/motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TextReveal } from '@/components/motion/TextReveal';
import { FadeUp } from '@/components/motion/FadeUp';
import { StaggerChildren } from '@/components/motion/StaggerChildren';
import { CountUp } from '@/components/motion/CountUp';

export function StatsCTA() {
  return (
    <section className="relative w-full overflow-hidden py-24 lg:py-32 bg-background">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-none opacity-50" />
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between text-left">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-none border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono text-primary mb-6 uppercase tracking-widest font-bold">
              /// IMPACT_METRICS
            </div>
            <TextReveal
              text="15+ Years of Trust"
              as="h2"
              className="block w-full text-left text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground mb-6"
            />
            <FadeUp delay={0.3}>
              <p className="text-muted-foreground text-xl font-light max-w-2xl leading-relaxed">
                Dedicated logistics services connecting{' '}
                <span className="text-foreground font-medium">Imphal</span> and{' '}
                <span className="text-foreground font-medium">New Delhi</span> with precision and
                care.
              </p>
            </FadeUp>
          </div>

          <FadeUp delay={0.4} className="shrink-0">
            <Link to="/login" className="inline-flex">
              <Button
                size="lg"
                className="h-14 rounded-none px-10 text-xs font-mono font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get a Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </FadeUp>
        </div>

        <StaggerChildren className="grid gap-8 md:grid-cols-3" staggerDelay={0.15}>
          {/* Stat 1 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
            className="group relative bg-card/60 backdrop-blur-lg border border-border/50 rounded-none p-10 text-center hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 text-primary group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <Package className="w-8 h-8" />
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold text-foreground mb-3 tracking-tight font-mono">
                <CountUp to={15} suffix="+" duration={2.5} />
              </div>
              <p className="text-muted-foreground font-medium text-lg uppercase tracking-widest text-[10px]">
                Years of Excellence
              </p>
            </div>
            {/* Corner Accent */}
            <div className="absolute top-0 right-0 w-16 h-16 border-t font-mono text-[10px] text-primary/40 pt-4 pr-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              OBJ_01
            </div>
          </motion.div>

          {/* Stat 2 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
            className="group relative bg-card/60 backdrop-blur-lg border border-border/50 rounded-none p-10 text-center hover:border-chart-2/50 hover:shadow-2xl hover:shadow-chart-2/10 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-none bg-chart-2/10 border border-chart-2/20 flex items-center justify-center mx-auto mb-8 text-chart-2 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold text-foreground mb-3 tracking-tight font-mono">
                <CountUp to={10} suffix="k+" duration={2.5} />
              </div>
              <p className="text-muted-foreground font-medium text-lg uppercase tracking-widest text-[10px]">
                Happy Clients
              </p>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t font-mono text-[10px] text-chart-2/40 pt-4 pr-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              OBJ_02
            </div>
          </motion.div>

          {/* Stat 3 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
            className="group relative bg-card/60 backdrop-blur-lg border border-border/50 rounded-none p-10 text-center hover:border-chart-4/50 hover:shadow-2xl hover:shadow-chart-4/10 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-none bg-chart-4/10 border border-chart-4/20 flex items-center justify-center mx-auto mb-8 text-chart-4 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <Clock className="w-8 h-8" />
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold text-foreground mb-3 tracking-tight font-mono">
                <CountUp to={4} suffix="+" duration={2.5} />
              </div>
              <p className="text-muted-foreground font-medium text-lg uppercase tracking-widest text-[10px]">
                Core Services Offered
              </p>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t font-mono text-[10px] text-chart-4/40 pt-4 pr-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              OBJ_03
            </div>
          </motion.div>
        </StaggerChildren>
      </div>
    </section>
  );
}
