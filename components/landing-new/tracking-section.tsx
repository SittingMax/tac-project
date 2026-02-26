import { useState } from 'react';
import { MapPin, FileText, Search, Loader2, Satellite } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TrackingResultCard } from '@/components/landing-new/tracking-result-card';
import { toast } from 'sonner';
import { getTrackingInfo, TrackingData } from '@/lib/tracking-service';
import { FadeUp } from '@/components/motion/FadeUp';

// --- Components ---

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
      console.error('Tracking search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section id="tracking" className="relative w-full py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center justify-center max-w-5xl mx-auto text-center">
          {/* Badge */}
          <FadeUp delay={0.1} className="mb-8">
            <Badge variant="secondary" className="gap-2 px-4 py-2 rounded-none backdrop-blur-sm">
              <Satellite className="w-4 h-4 text-secondary-foreground animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase">
                Live Satellite Uplink
              </span>
            </Badge>
          </FadeUp>

          {/* Heading */}
          <div className="mb-6 space-y-4">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground">
              Global Tracking Protocol
            </h2>
            <FadeUp delay={0.2}>
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
                Real-time visibility into your supply chain with millisecond precision telemetry and
                blockchain-verified custody logs.
              </p>
            </FadeUp>
          </div>

          {/* Tracking Interface */}
          <FadeUp delay={0.3} className="w-full max-w-xl mt-12">
            <div className="relative p-2 rounded-none bg-background/50 backdrop-blur-lg border border-border/50 shadow-2xl shadow-primary/5">
              {/* Tabs */}
              <div className="flex justify-center mb-6 pt-4">
                <Tabs
                  defaultValue="gps"
                  value={trackingMode}
                  onValueChange={(v: string) => setTrackingMode(v as 'gps' | 'custody')}
                  className="w-auto"
                >
                  <TabsList className="bg-transparent border-b border-border/10 p-0 h-auto gap-8">
                    <TabsTrigger
                      value="gps"
                      className="rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent transition-all"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      GPS Telemetry
                    </TabsTrigger>
                    <TabsTrigger
                      value="custody"
                      className="rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent transition-all"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Chain of Custody
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Input Area */}
              <div className="flex flex-col sm:flex-row items-center gap-3 p-2 bg-background rounded-none border border-border/50 shadow-inner group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="flex-1 w-full relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={
                      trackingMode === 'gps' ? 'ENTER CN / HAWB ID' : 'ENTER CUSTODY ID'
                    }
                    className="w-full h-12 pl-14 pr-4 bg-transparent border-none text-base font-mono placeholder:text-muted-foreground/50 focus-visible:ring-0 shadow-none"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 rounded-none bg-primary text-primary-foreground font-bold tracking-wide shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all"
                  onClick={handleSearch}
                  disabled={isSearching || !trackingNumber}
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'TRACE'}
                </Button>
              </div>

              {/* Recent Traces */}
              <div className="mt-8 mb-4 px-6">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-4 text-center">
                  Recent Traces
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {['WGS882190', 'WGS-02531', 'DEL-98234', 'IMP-45621'].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setTrackingNumber(example)}
                      className="px-4 py-2 rounded-none bg-secondary/5 border border-border/50 text-xs font-mono text-muted-foreground hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>

          {/* System Status */}
          <FadeUp delay={0.4} className="mt-12">
            <Badge
              variant="outline"
              className="gap-2 px-4 py-1.5 rounded-none border-primary/10 bg-primary/5 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-none bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-none bg-primary" />
              </span>
              <span className="font-mono text-[10px] font-bold tracking-widest text-primary uppercase">
                System Operational • 99.9% Uptime
              </span>
            </Badge>
          </FadeUp>
        </div>
      </div>

      {/* Tracking Result Modal */}
      <Dialog open={showResult && !!trackingData} onOpenChange={setShowResult}>
        <DialogContent
          className="border-none bg-transparent p-0 shadow-none sm:max-w-md w-full [&>button[class*='absolute']]:hidden"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">
            Tracking Information for {trackingData?.shipment.reference}
          </DialogTitle>
          {trackingData && (
            <div className="p-4">
              <TrackingResultCard data={trackingData} onClose={() => setShowResult(false)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
