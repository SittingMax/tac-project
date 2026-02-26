'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ManifestSummaryBarProps {
  totals: {
    shipments: number;
    packages: number;
    weight: number;
    codAmount?: number;
  };
  status?: string;
  isClosing?: boolean;
  disableClose?: boolean;
  onClose?: () => void;
  className?: string;
}

export function ManifestSummaryBar({
  totals,
  status,
  isClosing = false,
  disableClose = false,
  onClose,
  className,
}: ManifestSummaryBarProps) {
  return (
    <div className={cn('border-t bg-background/95 backdrop-blur-sm px-6 py-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Shipments:</span>
            <span className="font-semibold ml-2">{totals.shipments}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Packages:</span>
            <span className="font-semibold ml-2">{totals.packages}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Weight:</span>
            <span className="font-semibold ml-2">{totals.weight.toFixed(2)} kg</span>
          </div>
          {totals.codAmount && totals.codAmount > 0 && (
            <div>
              <span className="text-muted-foreground">COD:</span>
              <span className="font-semibold ml-2">₹{totals.codAmount.toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <Badge variant="secondary" className="uppercase text-[10px] tracking-wide">
              {status}
            </Badge>
          )}
          <Button
            type="button"
            variant="success"
            disabled={disableClose || isClosing}
            onClick={onClose}
          >
            {isClosing ? 'Closing...' : 'Close Manifest'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ManifestSummaryBar;
