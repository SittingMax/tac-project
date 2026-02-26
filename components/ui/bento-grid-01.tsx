'use client';

import { Shield, Globe, Plane, Clock, Zap } from 'lucide-react';

function WGSFeaturesSection() {
  return (
    <section className="bg-background relative py-32 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-none border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono text-primary mb-6">
            02 // CORE_CAPABILITIES
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground mb-6">
            Engineered for <br />
            <span className="text-muted-foreground">Maximum Velocity.</span>
          </h2>
          <p className="text-lg text-muted-foreground/80 leading-relaxed font-light">
            Our protocol optimizes every millisecond of the logistics chain. Autonomous routing,
            real-time telemetry, and zero-latency updates.
          </p>
        </div>

        {/* Yuna Style Dashed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-dashed border-border/60">
          {[
            {
              icon: Zap,
              title: 'Instant Telemetry',
              desc: 'Real-time packet tracking with millisecond precision APIs.',
              colSpan: 'md:col-span-1',
            },
            {
              icon: Clock,
              title: 'Predictive ETA',
              desc: 'AI-driven arrival times that account for traffic, weather, and customs.',
              colSpan: 'md:col-span-1',
            },
            {
              icon: Shield,
              title: 'Custody Chain',
              desc: 'Cryptographically verified handoffs at every node.',
              colSpan: 'md:col-span-1',
            },
            {
              icon: Globe,
              title: 'Global Mesh',
              desc: 'Interconnected logistics hubs forming a resilient delivery fabric.',
              colSpan: 'md:col-span-2', // Wide item
            },
            {
              icon: Plane,
              title: 'Aerial Priority',
              desc: 'Automated routing to next-flight-out for urgent payloads.',
              colSpan: 'md:col-span-1',
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`
                                ${item.colSpan}
                                group relative p-8 md:p-12 
                                border-r border-b border-dashed border-border/60
                                hover:bg-white/[0.02] transition-colors duration-500
                            `}
            >
              <div className="mb-6 h-12 w-12 rounded-none bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                <item.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <h3 className="font-mono text-xl font-bold tracking-tight text-foreground mb-3 flex items-center gap-2">
                {item.title}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary text-xs">
                  &rarr;
                </span>
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed max-w-[90%]">
                {item.desc}
              </p>

              {/* Corner Accent */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/0 group-hover:border-primary/50 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WGSFeaturesSection;
