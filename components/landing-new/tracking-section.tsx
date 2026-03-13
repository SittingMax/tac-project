import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { MapPin, FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TrackingResultCard } from '@/components/landing-new/tracking-result-card';
import { toast } from 'sonner';
import { getTrackingInfo, TrackingData } from '@/lib/tracking-service';
import { logger } from '@/lib/logger';
import { FadeUp } from '@/components/motion/FadeUp';
import { TextReveal } from '@/components/motion/TextReveal';
import { LottieSlot } from './lottie-slot';

export function TrackingSection() {
  const [trackingMode, setTrackingMode] = useState<'gps' | 'custody'>('gps');
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
      const result = await getTrackingInfo(trackingNumber.trim());
      if (result.success && result.data) {
        setTrackingData(result.data);
        setShowResult(true);
      } else {
        toast.error(result.error || 'Shipment not found. Please check the CN Number.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
      logger.error('TrackingSection', 'Tracking search error', { error });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section
      id="tracking"
      className="py-16 lg:py-24 bg-background text-foreground relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <FadeUp className="mb-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-card border border-border text-xs font-semibold text-primary mb-6 shadow-sm">
            Shipment Tracking
          </div>
          <TextReveal
            as="h2"
            text="Track Your Shipment"
            className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight text-center [text-wrap:balance]"
          />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-mono text-sm leading-relaxed">
            Easily monitor your cargo status between key global hubs. Enter your tracking number for
            instant custody updates.
          </p>
        </FadeUp>

        <FadeUp
          delay={0.2}
          className="max-w-2xl mx-auto p-8 md:p-14 rounded-md glass-panel relative overflow-visible shadow-xl shadow-primary/5 hover:border-primary/30 transition-colors duration-500"
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10">
            {/* Lottie Animation for Route Visualization */}
            <div className="mb-8 flex justify-center overflow-hidden">
              <LottieSlot
                src="/lottie/dotted A→B route.json"
                className="w-full max-w-[400px] h-24 sm:h-32 opacity-80"
                fallbackIcon={<MapPin className="h-8 w-8 text-primary opacity-50" />}
              />
            </div>

            <Tabs
              defaultValue="gps"
              value={trackingMode}
              onValueChange={(v: string) => setTrackingMode(v as 'gps' | 'custody')}
              className="w-full mb-10"
            >
              <TabsList className="grid w-full grid-cols-2 p-1 bg-transparent border-b border-border/50 rounded-md h-auto">
                <TabsTrigger
                  value="gps"
                  className="flex items-center justify-center gap-3 rounded-md py-3 pb-4 border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-none data-[state=active]:border-primary text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <MapPin className="h-4 w-4" />
                  Track by Number
                </TabsTrigger>
                <TabsTrigger
                  value="custody"
                  className="flex items-center justify-center gap-3 rounded-md py-3 pb-4 border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-none data-[state=active]:border-primary text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <FileText className="h-4 w-4" />
                  View History
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder={
                    trackingMode === 'gps' ? 'Enter tracking number' : 'Enter Custody ID'
                  }
                  className="h-14 pl-12 pr-4 rounded-md border border-border/50 bg-background/80 text-foreground text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground transition-all hover:bg-background shadow-inner"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  aria-label="Tracking Number Input"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !trackingNumber}
                className="h-14 px-10 bg-primary text-primary-foreground border border-transparent rounded-md font-semibold text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 w-full sm:w-auto hover:-translate-y-0.5"
                aria-live="polite"
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Track Entity'}
              </button>
            </div>

            <div className="mt-8 text-center pt-8 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest font-mono">
                Example tracking numbers
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['WGS882190', 'DEL-98234', 'IMP-45621'].map((example) => (
                  <button
                    key={example}
                    onClick={() => setTrackingNumber(example)}
                    className="px-4 py-2 text-xs font-medium border border-border/50 rounded-md bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FadeUp>
      </div>

      {/* Tracking Result Modal */}
      <Dialog open={showResult && !!trackingData} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Tracking Information</DialogTitle>
          {trackingData && (
            <TrackingResultCard data={trackingData} onClose={() => setShowResult(false)} />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
