import { Plane, Truck, PackageCheck, Warehouse, Map, Zap } from 'lucide-react';
import { FadeUp } from '@/components/motion/FadeUp';
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren';
import { motion } from '@/lib/motion';

const bentoItems = [
  {
    title: 'Air Freight',
    description: 'Expedited deliveries across major global hubs with priority boarding.',
    icon: <Plane className="h-6 w-6" />,
    colSpan: 'md:col-span-2 lg:col-span-2',
  },
  {
    title: 'Surface Transport',
    description: 'Reliable ground networks covering difficult terrains with live tracking.',
    icon: <Truck className="h-6 w-6" />,
    colSpan: 'md:col-span-1 lg:col-span-1',
  },
  {
    title: 'Pick & Drop Express',
    description: 'Hyper-local logistics solutions for last-mile and urgent inner-city needs.',
    icon: <PackageCheck className="h-6 w-6" />,
    colSpan: 'md:col-span-1 lg:col-span-1',
  },
  {
    title: 'Smart Warehousing',
    description: 'Secure, climate-controlled facilities designed for enterprise storage.',
    icon: <Warehouse className="h-6 w-6" />,
    colSpan: 'md:col-span-2 lg:col-span-1',
  },
  {
    title: 'Real-Time Telemetry',
    description: 'Continuous GPS data streams integration directly into your dashboard.',
    icon: <Map className="h-6 w-6" />,
    colSpan: 'md:col-span-3 lg:col-span-1',
  },
];

export function SystemCapabilities() {
  return (
    <section id="system-capabilities" className="py-24 relative bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6">
        <FadeUp className="flex flex-col mb-16 items-start gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-3 py-1 backdrop-blur-md">
            <span className="text-[10px] font-semibold uppercase tracking-widest">
              Our Capabilities
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Global Reach. <br />
            <span className="text-muted-foreground font-medium">Local Precision.</span>
          </h2>
        </FadeUp>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 auto-rows-[250px]">
          {bentoItems.map((item, idx) => (
            <motion.div
              key={idx}
              variants={staggerItemVariants}
              className={`group flex flex-col justify-between overflow-hidden bg-card/40 hover:bg-card/80 border border-border/40 hover:border-border/80 transition-all duration-500 rounded-2xl p-8 relative ${item.colSpan}`}
            >
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-background/50 border border-border/50 text-foreground shadow-sm group-hover:scale-110 transition-transform duration-500">
                {item.icon}
              </div>

              <div className="relative z-10 mt-auto">
                <h3 className="text-xl font-bold font-sans tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                  {item.description}
                </p>
              </div>

              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </motion.div>
          ))}
          
          {/* Highlight cell */}
          <motion.div
            variants={staggerItemVariants}
            className="md:col-span-3 lg:col-span-3 group relative overflow-hidden bg-primary text-primary-foreground rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 h-auto sm:h-[180px]"
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 blur-3xl rounded-full" />
            
            <div className="relative z-10 max-w-xl">
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                Predictive AI Routing
              </h3>
              <p className="text-primary-foreground/80 text-sm leading-relaxed">
                Our dynamic routing engine analyzes live weather, customs delays, and port congestion to reroute your cargo proactively—cutting delays by up to 35%.
              </p>
            </div>
            
            <div className="relative z-10 shrink-0">
              <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10">
                <Zap className="h-5 w-5 fill-current animate-pulse" />
                <span className="font-semibold text-sm tracking-wide">Always Optimizing</span>
              </div>
            </div>
          </motion.div>
        </StaggerChildren>
      </div>
    </section>
  );
}
