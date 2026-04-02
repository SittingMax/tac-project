import React, { useState } from 'react';
import { SizedDialog } from '@/components/ui-core/dialog/sized-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { TrackingResultCard } from '@/components/landing-new/tracking-result-card';
import { getTrackingInfo, TrackingData } from '@/lib/tracking-service';
import { toast } from 'sonner';

interface TrackingDialogProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function TrackingDialog({ trigger, children }: TrackingDialogProps) {
  const [awb, setAwb] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingData | null>(null);

  const handleTrace = async () => {
    if (!awb.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await getTrackingInfo(awb);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        toast.error(response.error || 'Shipment not found');
      }
    } catch {
      toast.error('Failed to track shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SizedDialog
      trigger={trigger || children || <Button>Track Shipment</Button>}
      title="Track Shipment"
      size="md"
    >
      {!result ? (
        <div className="flex flex-col gap-4 py-4">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-lg font-bold tracking-tight">Track Your Shipment</h2>
            <p className="text-sm text-muted-foreground">
              Enter your AWB or Order ID to get real-time status.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} strokeWidth={1.5} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="ENTER CN (e.g. WGS882190)"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
                autoFocus
              />
            </div>
            <Button onClick={handleTrace} disabled={loading || !awb}>
              {loading ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin" /> : 'Trace'}
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground pt-2">
            Try:{' '}
            <span
              className="font-mono text-primary cursor-pointer hover:underline"
              onClick={() => setAwb('WGS882190')}
            >
              WGS882190
            </span>
          </div>
        </div>
      ) : (
        <div className="py-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-lg">Tracking Result</h3>
            <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
              Back to Search
            </Button>
          </div>
          <TrackingResultCard data={result} />
        </div>
      )}
    </SizedDialog>
  );
}
