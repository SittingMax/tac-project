import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/landing-new/navbar';
import Lottie from 'lottie-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getTrackingInfo, type TrackingData } from '@/lib/tracking-service';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TrackingResultCard } from '@/components/landing-new/tracking-result-card';

const HeroFinal = () => {
  const [animationData, setAnimationData] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);

  const handleSearch = async () => {
    if (!trackingNumber.trim()) return;
    setIsSearching(true);
    setShowResult(false);
    setTrackingData(null);

    try {
      const result = await getTrackingInfo(trackingNumber.trim().toUpperCase());
      if (result.success && result.data) {
        setTrackingData(result.data);
        setShowResult(true);
      } else {
        toast.error(result.error || 'Shipment not found.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSearching(false);
    }
  };

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
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-3 py-1 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Imphal & New Delhi
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-6xl font-extrabold leading-[1.05] tracking-tighter text-foreground lg:text-7xl xl:text-8xl">
              Your Trusted <br />
              <span className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                Cargo Partner.
              </span>
            </h1>

            {/* Subtext */}
            <p className="mb-10 max-w-xl text-lg text-muted-foreground leading-relaxed">
              We deliver certainty. Experience state-of-the-art logistics with precise, real-time tracking across our global network.
            </p>

            {/* Tracking CTA Area */}
            <div className="relative z-20 mb-12 flex w-full max-w-md flex-col gap-3">
              <div className="relative flex items-center rounded-xl border border-border/50 bg-background/80 shadow-2xl backdrop-blur-xl transition hover:border-primary/50 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 pl-2 pr-1.5 py-1.5">
                <Search className="ml-3 h-5 w-5 text-muted-foreground transition-colors" />
                <Input
                  className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 px-4 placeholder:text-muted-foreground/60 w-full"
                  placeholder="Enter tracking number..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !trackingNumber.trim()}
                  className="h-10 px-6 font-semibold shadow-md cursor-pointer pointer-events-auto"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/80 pl-2">
                Try <button onClick={() => setTrackingNumber('WGS882190')} className="hover:text-primary underline underline-offset-2 transition-colors">WGS882190</button> or <button onClick={() => setTrackingNumber('DEL-98234')} className="hover:text-primary underline underline-offset-2 transition-colors">DEL-98234</button>
              </p>
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
              <div className="relative p-2 bg-transparent opacity-90 transition-opacity hover:opacity-100 duration-500">
                {animationData && (
                  <Lottie
                    animationData={animationData}
                    loop
                    autoplay
                    className="h-auto w-full lg:max-w-xl scale-110 origin-right drop-shadow-2xl mix-blend-plus-lighter"
                  />
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Tracking Result Modal */}
      <Dialog open={showResult && !!trackingData} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md bg-background border-border/50">
          <DialogTitle className="sr-only">Tracking Information</DialogTitle>
          {trackingData && (
            <TrackingResultCard data={trackingData} onClose={() => setShowResult(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroFinal;
