import { motion } from 'motion/react';
import { Plane, Truck, Package } from 'lucide-react';
import { FadeUp } from '@/components/motion/FadeUp';
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren';
import { LottieSlot } from './lottie-slot';

export function GlobalFleet() {
  return (
    <section
      id="global-fleet"
      className="py-16 lg:py-24 relative bg-background text-foreground overflow-hidden"
    >
      {/* Background glow coming from the top left */}

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <FadeUp className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-card border border-border text-xs font-semibold text-primary mb-6 shadow-sm">
            Enterprise Fleet
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1] [text-wrap:balance]">
            Comprehensive <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50 italic pr-2">
              Logistics Solutions
            </span>
          </h2>
          <p className="font-mono leading-relaxed max-w-xl mx-auto text-foreground/70 text-sm">
            End-to-end multi-modal transport network. Scalable for businesses of all sizes
            connecting global trade corridors.
          </p>
        </FadeUp>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Air Freight */}
          <motion.article
            variants={staggerItemVariants}
            className="group relative rounded-md bg-card border border-border/50 overflow-hidden transition duration-500 flex flex-col min-h-[380px] hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 focus-within:ring-2 focus-within:ring-primary/50"
            role="article"
            aria-labelledby="air-freight-title"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] group-hover:bg-primary/20 group-hover:scale-110 transition duration-1000 pointer-events-none" />

            {/* Corner Accents */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>

            <div className="p-8 relative z-10 flex flex-col flex-1 h-full justify-between">
              <div className="mb-8 inline-flex px-2 py-0.5 self-start bg-primary/5 border border-primary/20 font-mono text-primary/70 text-[10px] tracking-[0.1em] uppercase group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                Air Freight
              </div>

              <div className="flex-1 flex items-center justify-center my-6">
                <LottieSlot
                  src="/lottie/plane.json"
                  className="w-32 h-32 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition duration-500"
                  fallbackIcon={
                    <Plane
                      className="w-20 h-20 text-foreground group-hover:text-primary"
                      strokeWidth={1.5}
                    />
                  }
                />
              </div>

              <div>
                <h3
                  id="air-freight-title"
                  className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors"
                >
                  Air Cargo
                </h3>
                <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                  Express air freight services. Door-to-door prioritization globally.
                </p>
              </div>
            </div>
          </motion.article>

          {/* Card 2: Surface Transport */}
          <motion.article
            variants={staggerItemVariants}
            className="group relative rounded-md bg-card border border-border/50 overflow-hidden transition duration-500 flex flex-col min-h-[380px] hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 focus-within:ring-2 focus-within:ring-primary/50"
            role="article"
            aria-labelledby="surface-transport-title"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] group-hover:bg-primary/20 group-hover:scale-110 transition duration-1000 pointer-events-none" />

            {/* Corner Accents */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>

            <div className="p-8 relative z-10 flex flex-col flex-1 h-full justify-between">
              <div className="mb-8 inline-flex px-2 py-0.5 self-start bg-primary/5 border border-primary/20 font-mono text-primary/70 text-[10px] tracking-[0.1em] uppercase group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                Land Network
              </div>

              <div className="flex-1 flex items-center justify-center my-6">
                <LottieSlot
                  src="/lottie/truck.json"
                  className="w-32 h-32 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition duration-500"
                  fallbackIcon={
                    <Truck
                      className="w-20 h-20 text-foreground group-hover:text-primary"
                      strokeWidth={1.5}
                    />
                  }
                />
              </div>

              <div>
                <h3
                  id="surface-transport-title"
                  className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors"
                >
                  Surface Transport
                </h3>
                <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                  FTL and LTL solutions weaving through continuous international routes.
                </p>
              </div>
            </div>
          </motion.article>

          {/* Card 3: Warehousing */}
          <motion.article
            variants={staggerItemVariants}
            className="group relative rounded-md bg-card border border-border/50 overflow-hidden transition duration-500 flex flex-col min-h-[380px] hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 focus-within:ring-2 focus-within:ring-primary/50"
            role="article"
            aria-labelledby="fulfillment-title"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] group-hover:bg-primary/20 group-hover:scale-110 transition duration-1000 pointer-events-none" />

            {/* Corner Accents */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-primary/20 pointer-events-none group-hover:border-primary transition-colors duration-500"></div>

            <div className="p-8 relative z-10 flex flex-col flex-1 h-full justify-between">
              <div className="mb-8 inline-flex px-2 py-0.5 self-start bg-primary/5 border border-primary/20 font-mono text-primary/70 text-[10px] tracking-[0.1em] uppercase group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                Fulfillment
              </div>

              <div className="flex-1 flex items-center justify-center my-6">
                <LottieSlot
                  src="/lottie/package.json"
                  className="w-32 h-32 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition duration-500"
                  fallbackIcon={
                    <Package
                      className="w-20 h-20 text-foreground group-hover:text-primary"
                      strokeWidth={1.5}
                    />
                  }
                />
              </div>

              <div>
                <h3
                  id="fulfillment-title"
                  className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors"
                >
                  Fulfillment
                </h3>
                <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                  Smart warehousing operations with automated pick-and-pack tech.
                </p>
              </div>
            </div>
          </motion.article>
        </StaggerChildren>
      </div>
    </section>
  );
}
