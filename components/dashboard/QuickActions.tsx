import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PackagePlus, ScanLine, FileText, Printer, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScanner } from '@/context/useScanner';
import { ScanSource } from '@/types';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const [quickScanInput, setQuickScanInput] = useState('');
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const { subscribe } = useScanner();

  // Subscribe to scanner events for DISPLAY ONLY (recent scans list)
  // Navigation is handled exclusively by GlobalScanListener
  React.useEffect(() => {
    const unsubscribe = subscribe((data, source) => {
      if (source === ScanSource.BARCODE_SCANNER) {
        setRecentScans((prev) => [data, ...prev.slice(0, 2)]);
      }
    });
    return unsubscribe;
  }, [subscribe]);

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickScanInput.trim()) {
      navigate(`/tracking?cn=${quickScanInput.trim().toUpperCase()}`);
      setQuickScanInput('');
    }
  };

  const actions = [
    {
      label: 'New Shipment',
      description: 'Create & schedule orders',
      icon: PackagePlus,
      onClick: () => navigate('/shipments?new=true'),
    },
    {
      label: 'Scan Package',
      description: 'Update status via barcode',
      icon: ScanLine,
      onClick: () => navigate('/scanning'),
    },
    {
      label: 'Manifests',
      description: 'Review daily dispatches',
      icon: FileText,
      onClick: () => navigate('/manifests'),
    },
    {
      label: 'Print Labels',
      description: 'Batch print air waybills',
      icon: Printer,
      onClick: () => navigate('/print/label/recent'),
    },
  ];

  // Keyboard shortcuts could be implemented here via useHotkeys later

  return (
    <div data-testid="quick-actions" className="flex flex-col gap-3">
      {/* Compact action buttons row */}
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              onClick={action.onClick}
              className="gap-2 rounded-none font-mono text-[10px] uppercase tracking-widest border-border/40 hover:bg-muted/10 transition-colors"
            >
              <Icon className="h-4 w-4 text-primary" />
              {action.label}
            </Button>
          );
        })}

        {/* Inline quick scan */}
        <form onSubmit={handleQuickScan} className="flex gap-0 ml-auto">
          <Input
            value={quickScanInput}
            onChange={(e) => setQuickScanInput(e.target.value)}
            placeholder="CN / Tracking ID..."
            className="w-48 rounded-none border-r-0 font-mono text-xs uppercase"
            autoComplete="off"
          />
          <Button
            type="submit"
            variant="default"
            size="default"
            className="rounded-none font-mono text-[10px] uppercase tracking-widest border border-primary hover:bg-primary/90"
            disabled={!quickScanInput.trim()}
          >
            <Scan className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Recent scans — only show if any */}
      {recentScans.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-widest text-[10px]">Recent:</span>
          {recentScans.map((awb, index) => (
            <button
              key={`${awb}-${index}`}
              onClick={() => navigate(`/tracking?cn=${awb}`)}
              className="font-mono text-xs hover:text-primary transition-colors underline-offset-2 hover:underline"
            >
              {awb}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
