import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, PlaneTakeoff, Truck, Package, Globe } from 'lucide-react';
import { Navbar } from '@/components/landing-new/navbar';
import Lottie from 'lottie-react';
import { useState, useEffect } from 'react';

const HeroFinal = () => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/lottie/hero-truck.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(() => {
        /* silently fail — hero will just show empty space */
      });
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20 antialiased">
      <Navbar />

      {/* Background Gradient Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.foreground/.06),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.foreground/.12),transparent_65%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary opacity-[0.05] dark:opacity-[0.08] blur-[120px] rounded-full" />

        {/* Subtle grid to emphasize straight lines */}
        <div className="absolute inset-0 bg-[linear-gradient(oklch(100%_0_0deg/0.02)_1px,transparent_1px),linear-gradient(90deg,oklch(100%_0_0deg/0.02)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(oklch(100%_0_0deg/0.02)_1px,transparent_1px),linear-gradient(90deg,oklch(100%_0_0deg/0.02)_1px,transparent_1px)]" />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pt-20 sm:px-6 lg:px-8">
        {/* Main Grid Area */}
        <main className="grid flex-grow grid-cols-1 items-center gap-y-12 pb-12 pt-8 lg:grid-cols-2 lg:gap-16 lg:pt-16">
          {/* Content Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="z-20 flex flex-col justify-center pt-8 lg:pt-0"
          >
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-3 border border-border/50 bg-background/50 backdrop-blur-md p-1.5 shadow-sm rounded-md z-30">
              <div className="flex h-10 w-10 items-center justify-center bg-background border border-border/50 rounded-md shadow-sm">
                <Globe className="h-5 w-5 text-primary stroke-[1.5]" />
              </div>
              <div className="pr-3 flex flex-col justify-center">
                <h3 className="text-xs font-semibold leading-none text-foreground flex items-center gap-2">
                  15+ Years of Trust
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                </h3>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-1.5 leading-none">
                  Imphal & New Delhi
                </p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="mb-8 text-5xl font-bold leading-[1.1] tracking-tight text-foreground lg:text-7xl">
              Your Trusted <br />
              <span className="text-muted-foreground">Cargo Partner.</span>
            </h1>

            {/* Subtext */}
            <p className="mb-10 max-w-2xl text-lg font-mono text-muted-foreground leading-relaxed sm:text-xl">
              Serving clients for 15+ years with air, surface, and pick-and-drop logistics across
              Imphal & New Delhi.
            </p>

            {/* CTA & Avatar Group */}
            <div className="mb-16 flex flex-wrap items-center gap-8">
              <Button
                size="lg"
                asChild
                className="rounded-md shadow-xl shadow-primary/20 group gap-3 text-sm font-semibold h-14 px-8 border border-primary relative overflow-hidden bg-primary/90 hover:bg-primary transition-all duration-300"
              >
                <a href="#contact">
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-15deg]"></div>

                  <span className="relative z-10 text-primary-foreground text-glow">
                    Start a Shipment
                  </span>
                  <span className="relative z-10 flex h-7 w-7 items-center justify-center bg-background/20 backdrop-blur-md border border-background/30 rounded-md transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                    <ArrowUpRight className="h-5 w-5 stroke-primary-foreground" />
                  </span>
                  <div className="absolute inset-0 h-full w-full scale-0 rounded-md transition-all duration-500 ease-out group-hover:scale-100 group-hover:bg-primary-foreground/10 z-0"></div>
                </a>
              </Button>

              {/* Metric Items - Avatar Stack Style */}
              <div className="flex items-center -space-x-2 drop-shadow-sm">
                <div className="h-12 w-12 bg-background border border-border flex items-center justify-center text-primary rounded-md relative z-40 transition-transform hover:-translate-y-1 hover:z-50 shadow-[0_0_10px_oklch(0%_0_0deg/0.02)]">
                  <PlaneTakeoff className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div className="h-12 w-12 bg-background border border-border flex items-center justify-center text-primary rounded-md relative z-30 transition-transform hover:-translate-y-1 hover:z-50 shadow-[0_0_10px_oklch(0%_0_0deg/0.02)]">
                  <Truck className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div className="h-12 w-12 bg-background border border-border flex items-center justify-center text-primary rounded-md relative z-20 transition-transform hover:-translate-y-1 hover:z-50 shadow-[0_0_10px_oklch(0%_0_0deg/0.02)]">
                  <Package className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div className="h-12 w-[3.5rem] bg-secondary border border-border border-l-0 flex items-center justify-center text-secondary-foreground rounded-md relative z-10 transition-transform hover:-translate-y-1 hover:z-50 shadow-[0_0_10px_oklch(0%_0_0deg/0.02)]">
                  <span className="text-xs font-bold font-mono tracking-tighter">15y</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Lottie Animation Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative flex h-[500px] items-center justify-center lg:h-auto"
          >
            {/* Main Lottie Animation */}
            <div className="relative flex items-center justify-center md:justify-end">
              <div className="relative border border-border/50 p-2 bg-card/30 backdrop-blur-sm rounded-md shadow-2xl">
                {animationData && (
                  <Lottie
                    animationData={animationData}
                    loop
                    autoplay
                    className="h-auto w-full lg:max-w-xl"
                  />
                )}
                {/* Decorative corners */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-primary" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary" />
              </div>
              {/* Overlay Badge on Image */}
              <Badge
                variant="secondary"
                className="absolute right-6 top-6 text-xs glass-panel bg-background/40 backdrop-blur-md rounded-md border-transparent px-3 py-1.5"
              >
                MANUAL TRACKING{' '}
                <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-[ambient-pulse_2s_ease-in-out_infinite]"></span>
              </Badge>
            </div>

            {/* Floating Annotation 1 (Top Left) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute left-0 top-10 hidden max-w-[180px] glass-panel px-5 py-4 md:block lg:-left-12"
            >
              <div className="mb-2 flex items-center gap-2 border-b border-border/30 pb-2">
                <PlaneTakeoff className="h-5 w-5 stroke-primary drop-shadow-md drop-shadow-primary/50" />
                <span className="text-xs font-semibold text-foreground">Air Freight</span>
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground font-mono">
                Fast and reliable air cargo services for urgent shipments.
              </p>
              {/* Connector Line */}
              <div className="absolute -right-12 top-1/2 h-px w-12 origin-left animate-[draw-line_1.5s_ease-out_forwards] overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-border to-primary"></div>
              </div>
              <div className="absolute -right-12 top-1/2 h-1.5 w-1.5 -translate-y-1/2 bg-primary shadow-glow-primary animate-[ambient-pulse_2s_ease-in-out_infinite]"></div>
            </motion.div>

            {/* Floating Annotation 2 (Bottom Right) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="absolute bottom-20 right-0 hidden max-w-[200px] glass-panel px-5 py-4 md:block lg:-right-4"
            >
              <div className="mb-2 flex items-center gap-2 border-b border-border/30 pb-2">
                <Package className="h-5 w-5 stroke-primary drop-shadow-md drop-shadow-primary/50" />
                <span className="text-xs font-semibold text-foreground">Expert Packing</span>
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground font-mono">
                Professional packing ensuring your goods are safe and secure.
              </p>
              {/* Connector Line */}
              <div className="absolute -left-8 top-1/2 h-px w-8 origin-right animate-[draw-line_1.5s_ease-out_forwards] overflow-hidden">
                <div className="h-full w-full bg-gradient-to-l from-border to-primary"></div>
              </div>
              <div className="absolute -left-8 top-1/2 h-1.5 w-1.5 -translate-y-1/2 bg-primary shadow-glow-primary animate-[ambient-pulse_2s_ease-in-out_infinite]"></div>
            </motion.div>

            {/* Floating Annotation 3 (Mid Left) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-1/3 left-4 hidden items-center gap-4 glass-panel px-4 py-3 md:flex lg:-left-8"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
                <Truck className="h-5 w-5 stroke-primary" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-mono tracking-widest font-bold text-foreground">
                  Surface & Delivery
                </span>
                <span className="block text-[9px] font-mono text-muted-foreground">
                  Pick & Drop Services
                </span>
              </div>
              {/* Connector Line */}
              <div className="absolute -right-8 top-1/2 h-px w-8 origin-left rotate-[15deg] animate-[draw-line_1.5s_ease-out_forwards] overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-border to-primary"></div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default HeroFinal;
