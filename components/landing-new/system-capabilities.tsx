'use client';

import { Globe, Shield, Zap, LineChart, FileCheck, ArrowRight } from 'lucide-react';
import { FadeUp } from '@/components/motion/FadeUp';
import { Button } from '@/components/ui/button';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

function BentoCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`group relative h-full rounded-none border border-border bg-card/80 backdrop-blur-3xl overflow-hidden ${className || ''}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(139, 92, 246, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </div>
  );
}

export function SystemCapabilities() {
  return (
    <section
      id="system-capabilities"
      className="relative w-full py-24 lg:py-32 overflow-hidden bg-background"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-none opacity-40 mix-blend-screen" />
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-secondary/5 blur-[100px] rounded-none opacity-40 mix-blend-screen" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
        {/* Header */}
        <div className="mb-20 max-w-2xl">
          <FadeUp delay={0.1}>
            <div className="inline-flex items-center gap-2 rounded-none border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono text-primary mb-6">
              02 // SYSTEM_CORE
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground mb-6 pb-1">
              Neural Logistics <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">
                Architecture
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light max-w-xl">
              A unified protocol optimizing every millisecond of the logistics chain. Autonomous
              routing, real-time telemetry, and zero-latency updates.
            </p>
          </FadeUp>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 grid-rows-[auto] gap-6">
          {/* 1. Global Telemetry (Large Feature) */}
          <FadeUp delay={0.2} className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2">
            <BentoCard className="min-h-[400px] p-8 flex flex-col justify-between">
              {/* Content */}
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-none bg-foreground/5 border border-border flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-500">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                  Global Telemetry Mesh
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm">
                  Real-time tracking across 120+ countries with millisecond precision and satellite
                  backup. Currently processing 400k+ events/sec across the grid.
                </p>
              </div>

              {/* Technical Graphic Overlay */}
              <div className="absolute bottom-0 right-0 w-3/4 h-3/4 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_100%_100%_at_100%_100%,black_60%,transparent_100%)]" />
              </div>
            </BentoCard>
          </FadeUp>

          {/* 2. Predictive Routing (Tall) */}
          <FadeUp delay={0.3} className="col-span-1 md:col-span-1 lg:col-span-1 row-span-2">
            <BentoCard className="min-h-[400px] p-8 flex flex-col">
              <div className="relative z-10 w-12 h-12 rounded-none bg-chart-2/10 border border-chart-2/20 flex items-center justify-center mb-6 text-chart-2 shrink-0 group-hover:scale-110 transition-transform duration-500">
                <Zap className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight relative z-10">
                Predictive Routing
              </h3>
              <p className="text-sm text-muted-foreground mb-auto relative z-10">
                AI-driven adjustments for weather, traffic, and geopolitical events in real-time.
              </p>

              {/* Stat Visualization */}
              <div className="mt-8 pt-6 border-t border-border relative z-10">
                <div className="flex justify-between text-[10px] uppercase font-mono text-muted-foreground mb-2">
                  <span>Efficiency</span>
                  <span className="text-primary">98.5%</span>
                </div>
                <div className="w-full h-1.5 bg-foreground/10 rounded-none overflow-hidden">
                  <div className="h-full w-[98.5%] bg-primary shadow-[0_0_8px_var(--tw-shadow-color)] shadow-primary/50" />
                </div>
              </div>
            </BentoCard>
          </FadeUp>

          {/* 3. Secure Chain (Square) */}
          <FadeUp delay={0.4} className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1">
            <BentoCard className="min-h-[200px] p-6 group-hover:border-primary/50 transition-colors duration-500">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-[10px] font-mono text-primary/80 border border-primary/20 bg-primary/10 px-2 py-0.5 rounded-none">
                  AES-256
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight relative z-10">
                Secure Chain
              </h3>
              <p className="text-xs text-muted-foreground relative z-10">
                Blockchain-verified custody logs.
              </p>
            </BentoCard>
          </FadeUp>

          {/* 4. Instant Customs (Square) */}
          <FadeUp delay={0.5} className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1">
            <BentoCard className="min-h-[200px] p-6 group-hover:border-secondary/50 transition-colors duration-500">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <FileCheck className="w-6 h-6 text-chart-3" />
                <span className="text-[10px] font-mono text-chart-3/80 border border-chart-3/20 bg-chart-3/10 px-2 py-0.5 rounded-none">
                  AUTO
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight relative z-10">
                Instant Customs
              </h3>
              <p className="text-xs text-muted-foreground relative z-10">
                Automated clearance docs.
              </p>
            </BentoCard>
          </FadeUp>

          {/* 5. Advanced Analytics (Wide) */}
          <FadeUp delay={0.6} className="col-span-1 md:col-span-3 lg:col-span-4 row-span-1">
            <BentoCard className="min-h-[180px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 group-hover:border-foreground/20 transition-colors duration-500">
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-14 h-14 rounded-none bg-chart-4/10 border border-chart-4/20 flex items-center justify-center text-chart-4 shrink-0 group-hover:scale-110 transition-transform duration-500">
                  <LineChart className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
                    Deep Analytics
                  </h3>
                  <p className="text-muted-foreground max-w-lg">
                    Full visibility into supply chain performance, cost optimization, and vendor
                    reliability metrics.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="rounded-none px-8 h-12 border-border bg-transparent hover:bg-foreground/5 backdrop-blur-sm transition-all font-mono text-xs relative z-10"
              >
                VIEW DASHBOARD_DEMO <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </BentoCard>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
