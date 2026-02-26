import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Scan, Printer, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UniversalBarcode } from '@/components/barcodes';
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
      icon: Plus,
      color: 'text-primary',
      onClick: () => navigate('/shipments?new=true'),
      shortcut: 'N',
    },

    {
      label: 'Scan Package',
      description: 'Update status via barcode',
      icon: Scan,
      color: 'text-chart-5',
      onClick: () => navigate('/scanning'),
      shortcut: 'S',
    },
    {
      label: 'Manifests',
      description: 'Review daily dispatches',
      icon: FileText,
      color: 'text-status-warning',
      onClick: () => navigate('/manifests'),
      shortcut: 'M',
    },
    {
      label: 'Print Labels',
      description: 'Batch print air waybills',
      icon: Printer,
      color: 'text-status-success',
      onClick: () => navigate('/print/label/recent'),
      shortcut: 'P',
    },
  ];

  // Keyboard shortcuts could be implemented here via useHotkeys later

  return (
    <>
      <div data-testid="quick-actions" className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border/40 pb-4">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-foreground">Command Center</h3>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">High-frequency operations</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border border-border/40">
          {actions.map((action) => (
            <div
              key={action.label}
              data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-background p-6 flex flex-col justify-between group relative overflow-hidden transition-all hover:bg-muted/10 cursor-pointer h-32"
              onClick={action.onClick}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{action.label}</span>
                <action.icon className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium tracking-tight group-hover:text-primary transition-colors pr-8">
                {action.description}
              </p>
              <div className="absolute top-6 right-6 text-[10px] font-mono opacity-20 group-hover:opacity-100 transition-opacity border border-current px-1.5 py-0.5 pointer-events-none">
                {action.shortcut}
              </div>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Scan Section */}
      <div className="mt-8 border-t border-border/40 pt-8">
        <div className="max-w-md">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Scan className="w-3 h-3" />
            Direct Telemetry Query
          </h3>

          <form onSubmit={handleQuickScan} className="flex gap-0 mb-6">
            <Input
              value={quickScanInput}
              onChange={(e) => setQuickScanInput(e.target.value)}
              placeholder="ENTER CN / TRACKING ID..."
              className="flex-1 rounded-none border-r-0 font-mono text-xs uppercase"
              autoComplete="off"
            />
            <Button type="submit" variant="default" className="rounded-none font-mono text-xs uppercase tracking-widest px-8" disabled={!quickScanInput.trim()}>
              Execute
            </Button>
          </form>

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Recent Queries:</p>
              <div className="grid gap-px bg-border/40 border border-border/40">
                {recentScans.map((awb, index) => (
                  <div
                    key={`${awb}-${index}`}
                    className="flex items-center justify-between p-4 bg-background hover:bg-muted/10 cursor-pointer transition-colors group relative overflow-hidden"
                    onClick={() => navigate(`/tracking?cn=${awb}`)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-xs font-mono font-medium tracking-widest group-hover:text-primary transition-colors">{awb}</span>
                    </div>
                    <div className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity mix-blend-difference">
                      <UniversalBarcode
                        value={awb}
                        mode="compact"
                        width={2}
                        height={30}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
