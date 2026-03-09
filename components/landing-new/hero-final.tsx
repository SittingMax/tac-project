import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Truck, Box, ShieldCheck, ArrowUpRight, Plane, Package } from 'lucide-react';
import { Navbar } from '@/components/landing-new/navbar';

const HeroFinal = () => {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20 antialiased">
      <Navbar />

      {/* Background Gradient Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.foreground/.06),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.foreground/.12),transparent_65%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary opacity-[0.05] dark:opacity-[0.08] blur-[120px] rounded-none" />

        {/* Subtle grid to emphasize straight lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
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
            <div className="mb-8 flex items-center gap-4 border border-border/50 bg-background/50 backdrop-blur-sm p-2 shadow-sm rounded-none w-max">
              <div className="flex h-10 w-10 items-center justify-center border border-border bg-background shadow-sm rounded-none">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div className="pr-4">
                <h3 className="text-xs font-mono uppercase tracking-widest leading-tight text-foreground font-bold">
                  15+ Years of Trust
                </h3>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
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

            {/* Trusted By Logos */}
            <div className="mb-10">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Trusted Enterprise Partners
              </p>
              <div className="flex items-center gap-6 opacity-60 grayscale transition-all duration-500 hover:grayscale-0">
                <Truck className="h-6 w-6" />
                <Globe className="h-6 w-6" />
                <Box className="h-6 w-6" />
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            {/* CTA & Avatar Group */}
            <div className="mb-16 flex flex-wrap items-center gap-8">
              <Button
                size="lg"
                className="rounded-none shadow-xl shadow-primary/10 group gap-3 text-sm uppercase tracking-widest font-mono font-bold h-14 px-8 border border-primary relative overflow-hidden"
              >
                <span className="relative z-10">Start a Shipment</span>
                <span className="relative z-10 flex h-7 w-7 items-center justify-center bg-primary-foreground/10 border border-primary-foreground/20 rounded-none transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
                <div className="absolute inset-0 h-full w-full scale-0 rounded-none transition-all duration-300 ease-out group-hover:scale-100 group-hover:bg-primary-foreground/10"></div>
              </Button>

              <div className="flex items-center -space-x-3">
                <div className="h-10 w-10 border-2 border-background rounded-none bg-muted flex items-center justify-center text-muted-foreground z-30">
                  <Plane className="h-4 w-4" />
                </div>
                <div className="h-10 w-10 border-2 border-background rounded-none bg-muted flex items-center justify-center text-muted-foreground z-20">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="h-10 w-10 border-2 border-background rounded-none bg-muted flex items-center justify-center text-muted-foreground z-10">
                  <Package className="h-4 w-4" />
                </div>
                <div className="h-10 w-10 border-2 border-background bg-secondary z-0 rounded-none flex items-center justify-center">
                  <span className="bg-secondary text-secondary-foreground text-xs font-bold">
                    +15y
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Product Image Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative flex h-[500px] items-center justify-center lg:h-auto"
          >
            {/* Main Product Image */}
            <div className="relative flex items-center justify-center md:justify-end">
              <div className="relative border border-border/50 p-2 bg-card/30 backdrop-blur-sm rounded-none shadow-2xl">
                <img
                  src="/hero-bg-new.png"
                  className="h-auto w-full rounded-none object-cover mix-blend-normal lg:max-w-xl"
                  alt="High-tech Logistics Container"
                />
                {/* Decorative corners */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-primary" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary" />
              </div>
              {/* Overlay Badge on Image */}
              <Badge
                variant="secondary"
                className="absolute right-6 top-6 font-mono tracking-widest backdrop-blur-md bg-background/80 rounded-none border border-border/50 uppercase text-[10px]"
              >
                MANUAL TRACKING{' '}
                <span className="ml-2 inline-block h-1.5 w-1.5 rounded-none text-muted-foreground"></span>
              </Badge>
            </div>

            {/* Floating Annotation 1 (Top Left) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute left-0 top-10 hidden max-w-[180px] rounded-none border border-border/50 bg-background/90 p-4 shadow-lg backdrop-blur-xl md:block lg:-left-12"
            >
              <div className="mb-2 flex items-center gap-2 border-b border-border/30 pb-2">
                <Plane className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono uppercase tracking-widest font-bold text-foreground">
                  Air Freight
                </span>
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground font-mono">
                Fast and reliable air cargo services for urgent shipments.
              </p>
              {/* Connector Line */}
              <div className="absolute -right-12 top-1/2 h-px w-12 bg-border"></div>
              <div className="absolute -right-12 top-1/2 h-1.5 w-1.5 -translate-y-1/2 bg-primary"></div>
            </motion.div>

            {/* Floating Annotation 2 (Bottom Right) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="absolute bottom-20 right-0 hidden max-w-[200px] rounded-none border border-border/50 bg-background/90 p-4 shadow-lg backdrop-blur-xl md:block lg:-right-4"
            >
              <div className="mb-2 flex items-center gap-2 border-b border-border/30 pb-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono uppercase tracking-widest font-bold text-foreground">
                  Expert Packing
                </span>
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground font-mono">
                Professional packing ensuring your goods are safe and secure.
              </p>
              {/* Connector Line */}
              <div className="absolute -left-8 top-1/2 h-px w-8 bg-border"></div>
              <div className="absolute -left-8 top-1/2 h-1.5 w-1.5 -translate-y-1/2 bg-primary"></div>
            </motion.div>

            {/* Floating Annotation 3 (Mid Left) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-1/3 left-4 hidden items-center gap-3 rounded-none border border-border/50 bg-background/90 p-3 shadow-lg backdrop-blur-xl md:flex lg:-left-8"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary/10 border border-primary/20">
                <Truck className="h-4 w-4 text-primary" />
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
              <div className="absolute -right-8 top-1/2 h-px w-8 origin-left rotate-12 bg-border"></div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default HeroFinal;
