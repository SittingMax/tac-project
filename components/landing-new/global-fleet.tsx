'use client';

import { Plane, Truck, Package, Network } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeUp } from '@/components/motion/FadeUp';

const fleetItems = [
  {
    id: 'air-freight',
    title: 'Air Domination',
    subtitle: 'Strategic heavy-lift capabilities for urgent global deployment.',
    icon: Plane,
    color: 'var(--chart-1)', // Indigo for air
    progress: 92,
  },
  {
    id: 'surface-transport',
    title: 'Surface Grid',
    subtitle: 'High-density ground logistics network with autonomous handoffs.',
    icon: Truck,
    color: 'var(--chart-2)', // Violet for ground
    progress: 87,
  },
  {
    id: 'last-mile',
    title: 'Precision Drop',
    subtitle: 'Urban tactical delivery systems for final-mile execution.',
    icon: Package,
    color: 'var(--chart-3)', // Purple for delivery
    progress: 78,
  },
  {
    id: 'global-hub',
    title: 'Command Nodes',
    subtitle: '24/7 automated sorting facilities with AI-driven routing.',
    icon: Network,
    color: 'var(--chart-4)', // Blue-Indigo for command
    progress: 95,
  },
];

export function GlobalFleet() {
  return (
    <section id="global-fleet" className="py-24 lg:py-32 bg-background relative overflow-hidden">
      {/* Technical Background Grid & Glows */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,black_40%,transparent_100%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 blur-[120px] rounded-none pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
        <FadeUp>
          <div className="mb-16 md:mb-24 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-primary/80 border border-primary/20 px-4 py-1.5 rounded-none uppercase tracking-widest bg-primary/5 backdrop-blur-sm mb-6">
              <span className="w-1.5 h-1.5 rounded-none bg-primary animate-pulse" />
              /// FLEET_MANIFEST_V4.0
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mt-2 mb-6 text-foreground pb-1">
              Global{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">
                Logistics Assets
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium">
              A multi-modal network engineered for speed, reliability, and security across every terrain. Deploy cargo across the world with seamless automated handoffs.
            </p>
          </div>
        </FadeUp>

        {/* Aura-style Bento Grid for Fleet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {fleetItems.map((item, index) => (
            <FadeUp key={item.id} delay={0.2 + index * 0.1}>
              <motion.div
                whileHover={{ y: -5 }}
                className="group relative h-full min-h-[380px] rounded-none border border-border bg-card/60 backdrop-blur-3xl overflow-hidden p-8 lg:p-10 flex flex-col transition-all duration-500 hover:shadow-[0_0_40px_-5px_var(--tw-shadow-color)]"
                style={{ '--tw-shadow-color': `oklch(from ${item.color} l c h / 0.3)` } as React.CSSProperties}
              >
                {/* Minimalist Glowing Edge on Hover (replaces the muddy blob) */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 20px 0 oklch(from ${item.color} l c h / 0.1)` }}
                />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-none flex items-center justify-center border border-border bg-background group-hover:scale-110 transition-transform duration-500 overflow-hidden relative">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: item.color }} />
                        <span className="font-mono font-bold text-lg" style={{ color: item.color }}>0{index + 1}</span>
                      </div>
                      <div className="w-12 h-12 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        <item.icon className="w-7 h-7" style={{ color: item.color }} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded-none border border-border bg-background/50 hidden sm:block">
                      ACTIVE_NODE
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-sm">
                    {item.subtitle}
                  </p>

                  {/* Decorative Elements replacing standard images for a technical look */}
                  <div className="mt-8 pt-6 border-t border-border flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Status</span>
                      <span className="text-xs font-semibold" style={{ color: item.color }}>Operational</span>
                    </div>
                    {/* Simulated tech bar */}
                    <div className="w-1/2 h-1 rounded-none overflow-hidden bg-background">
                      <motion.div
                        className="h-full rounded-none"
                        style={{ backgroundColor: item.color, width: `${item.progress}%` }}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
