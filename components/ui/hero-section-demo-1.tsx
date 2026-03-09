'use client';

import { motion } from 'motion/react';
import { ArrowRight, PlaneTakeoff } from 'lucide-react';
import { Navbar } from '@/components/landing-new/navbar';
import { RetroGrid } from '@/components/ui/retro-grid';

export default function HeroSectionOne() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-[90vh] overflow-hidden pt-20 pb-16 w-full flex flex-col items-center justify-center">
        {/* Background Gradients and Effects matching previous theme */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.foreground/.08),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.foreground/.14),transparent_65%)]" />

        {/* TAC Branding Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary opacity-[0.07] blur-[120px] rounded-full pointer-events-none z-0"></div>

        {/* Aceternity Grid Line Accents combined with TAC RetroGrid */}
        <RetroGrid
          className="z-0"
          opacity={0.72}
          angle={68}
          cellSize={64}
          lightLineColor="color-mix(in oklab, var(--foreground) 18%, transparent)"
          darkLineColor="color-mix(in oklab, var(--foreground) 34%, transparent)"
        />
        <div className="absolute inset-y-0 left-10 md:left-20 h-full w-px bg-border/20 z-0">
          <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
        </div>
        <div className="absolute inset-y-0 right-10 md:right-20 h-full w-px bg-border/20 z-0">
          <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
        </div>

        <div className="px-6 py-10 md:py-20 w-full max-w-7xl mx-auto flex flex-col items-center justify-center relative z-10">
          {/* Transparent badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-muted/20 backdrop-blur-sm mb-8 mx-auto"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-sm font-medium text-foreground">
              Tapan Associate Cargo • Global Logistics
            </span>
          </motion.div>

          <h1 className="relative z-10 mx-auto max-w-5xl text-center text-5xl font-bold text-foreground md:text-6xl lg:text-[5.5rem] tracking-tighter leading-[1.1] mb-6">
            {'Streamline your global logistics workflow.'.split(' ').map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: 'blur(4px)', y: 10 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: 'easeInOut',
                }}
                className={`mr-2 inline-block ${word.includes('logistics') || word.includes('workflow') ? 'text-primary' : ''}`}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
              delay: 0.8,
            }}
            className="relative z-10 mx-auto max-w-2xl text-center text-lg md:text-xl font-medium text-muted-foreground leading-relaxed mb-10"
          >
            Real-time shipment tracking, automated manifest management, and intelligent routing for
            air and ground freight operations.
          </motion.p>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
              delay: 1,
            }}
            className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mx-auto mb-16"
          >
            <a
              href="#tracking"
              className="group relative flex w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-8 py-4 font-bold text-primary-foreground transition-all hover:scale-105 shadow-[0_0_40px_-10px_var(--primary)] text-lg"
            >
              <span>Start Tracking</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            <button className="group flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-border/50 bg-card px-8 py-4 font-bold text-foreground transition-all hover:bg-muted/50 text-lg">
              <PlaneTakeoff className="w-5 h-5" />
              <span>Book a Demo</span>
            </button>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
              delay: 1.2,
            }}
            className="relative z-10 w-full max-w-4xl mx-auto pt-8 border-t border-border/40 text-center"
          >
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
              Trusted by industry leaders
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale filter hover:grayscale-0 transition-all duration-500">
              <div className="text-xl font-bold font-serif text-foreground">ACME Corp</div>
              <div className="text-xl font-bold tracking-widest text-foreground">GLOBAL</div>
              <div className="text-xl font-bold italic text-foreground">TechFlow</div>
              <div className="text-xl font-bold text-foreground">NEXUS</div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
