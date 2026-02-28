import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PackagePlus, ScanLine, FileText, Printer, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UniversalBarcode } from '@/components/barcodes';
import { useScanner } from '@/context/useScanner';
import { ScanSource } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
    <>
      <div data-testid="quick-actions" className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border/40 pb-4">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-foreground">
              Command Center
            </h3>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
              High-frequency operations
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <motion.button
                key={action.label}
                onClick={action.onClick}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={cn(
                  "flex items-center gap-5 p-5 text-left w-full relative overflow-hidden",
                  "bg-white dark:bg-slate-900 rounded-xl",
                  "border border-slate-200/60 dark:border-slate-800",
                  "shadow-sm transition-colors duration-300",
                  "hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                )}
              >
                <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                  <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                </div>

                <div className="flex flex-col">
                  <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    {action.label}
                  </span>
                  <span className="text-sm leading-tight text-slate-500 dark:text-slate-400 mt-1">
                    {action.description}
                  </span>
                </div>
              </motion.button>
            );
          })}
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
            <Button
              type="submit"
              variant="default"
              className="rounded-none font-mono text-xs uppercase tracking-widest px-8"
              disabled={!quickScanInput.trim()}
            >
              Execute
            </Button>
          </form>

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Recent Queries:
              </p>
              <div className="grid gap-px bg-border/40 border border-border/40">
                {recentScans.map((awb, index) => (
                  <div
                    key={`${awb}-${index}`}
                    role="button"
                    tabIndex={0}
                    className="flex items-center justify-between p-4 bg-background hover:bg-muted/10 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors group relative overflow-hidden"
                    onClick={() => navigate(`/tracking?cn=${awb}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/tracking?cn=${awb}`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-xs font-mono font-medium tracking-widest group-hover:text-primary transition-colors">
                        {awb}
                      </span>
                    </div>
                    <div className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity mix-blend-difference">
                      <UniversalBarcode value={awb} mode="compact" width={2} height={30} />
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
