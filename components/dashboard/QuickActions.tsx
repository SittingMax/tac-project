import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Plus, Scan, Printer, FileText, ArrowRight } from 'lucide-react';
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2">
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Command Center
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {actions.map((action) => (
            <div
              key={action.label}
              data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              role="button"
              tabIndex={0}
              className="group relative flex flex-col gap-3 pb-4 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-8"
              onClick={action.onClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  action.onClick();
                }
              }}
            >
              <div className="flex items-center gap-3">
                <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                <span className="text-sm font-medium tracking-widest text-foreground uppercase">
                  {action.label}
                </span>
              </div>
              <p className="text-xs font-mono tracking-wide text-muted-foreground group-hover:text-foreground/80 transition-colors">
                {action.description}
              </p>
              <div className="absolute top-0 right-0 text-[9px] font-mono text-muted-foreground/30 group-hover:text-muted-foreground transition-colors uppercase tracking-widest">
                [{action.shortcut}]
              </div>
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-border/40"></div>
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-foreground transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Scan Section */}
      <div className="mt-6 pt-6 flex flex-col md:flex-row gap-8 md:items-end border-t border-border/20">
        <div className="flex-1 max-w-xl">
          <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Scan className="w-3 h-3" />
            Direct Telemetry Query
          </h3>

          <form onSubmit={handleQuickScan} className="relative flex items-center group">
            <Input
              value={quickScanInput}
              onChange={(e) => setQuickScanInput(e.target.value)}
              placeholder="ENTER CN / TRACKING ID..."
              className="w-full bg-transparent border-0 border-b border-border/40 rounded-none px-0 py-2 h-10 font-mono text-sm tracking-widest uppercase focus-visible:ring-0 focus-visible:border-foreground placeholder:text-muted-foreground/40 transition-colors"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!quickScanInput.trim()}
              className="absolute right-0 p-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors disabled:hover:text-muted-foreground outline-none focus-visible:text-foreground"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Recent Scans Inline list */}
        {recentScans.length > 0 && (
          <div className="flex flex-col gap-2 pb-2">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
              Recent Activity
            </p>
            <div className="flex flex-wrap gap-4">
              {recentScans.map((awb, index) => (
                <button
                  key={`${awb}-${index}`}
                  className="text-xs font-mono tracking-widest text-muted-foreground hover:text-foreground border-b border-transparent hover:border-foreground transition-all uppercase outline-none focus-visible:text-foreground focus-visible:border-foreground"
                  onClick={() => navigate(`/tracking?cn=${awb}`)}
                >
                  {awb}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
