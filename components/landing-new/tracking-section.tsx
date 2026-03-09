import { useState } from 'react';
import { MapPin, FileText, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TrackingResultCard } from '@/components/landing-new/tracking-result-card';
import { toast } from 'sonner';
import { getTrackingInfo, TrackingData } from '@/lib/tracking-service';
import { logger } from '@/lib/logger';

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
    <section id="tracking" className="py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-muted/50 border border-border/50 text-xs font-mono font-bold text-primary mb-6 uppercase tracking-widest">
            Manual Tracking
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Track Your Shipment
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-mono text-sm leading-relaxed">
            Easily monitor your cargo status between Imphal and New Delhi. Enter your CN number for
            instant custody updates.
          </p>
        </div>

        <div className="max-w-2xl mx-auto p-8 rounded-none bg-card border border-border/50 shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-none blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10">
            <Tabs
              defaultValue="gps"
              value={trackingMode}
              onValueChange={(v: string) => setTrackingMode(v as 'gps' | 'custody')}
              className="w-full mb-8"
            >
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-none border border-border/50">
                <TabsTrigger
                  value="gps"
                  className="flex items-center gap-2 rounded-none py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 uppercase tracking-widest text-[10px] font-mono font-bold"
                >
                  <MapPin className="h-3 w-3" />
                  Track by CN
                </TabsTrigger>
                <TabsTrigger
                  value="custody"
                  className="flex items-center gap-2 rounded-none py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 uppercase tracking-widest text-[10px] font-mono font-bold"
                >
                  <FileText className="h-3 w-3" />
                  Custody Log
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={trackingMode === 'gps' ? 'Enter CN Number' : 'Enter Custody ID'}
                  className="h-14 pl-12 rounded-none border border-border/50 bg-background text-sm shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary font-mono uppercase tracking-wider"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !trackingNumber}
                className="h-14 px-8 bg-primary text-primary-foreground rounded-none font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-all duration-300 shadow-[0_0_20px_-5px_var(--primary)] disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto relative overflow-hidden group border border-primary"
              >
                <span className="relative z-10">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track'}
                </span>
                <div className="absolute inset-0 h-full w-full scale-0 rounded-none transition-all duration-300 ease-out group-hover:scale-100 group-hover:bg-primary-foreground/10"></div>
              </button>
            </div>

            <div className="mt-8 text-center border-t border-border/40 pt-8">
              <p className="text-[10px] font-bold text-muted-foreground mb-4 uppercase tracking-widest font-mono">
                Example tracking numbers
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['WGS882190', 'DEL-98234', 'IMP-45621'].map((example) => (
                  <button
                    key={example}
                    onClick={() => setTrackingNumber(example)}
                    className="px-4 py-2 text-xs font-mono font-medium border border-border/50 rounded-none bg-muted/20 text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
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
