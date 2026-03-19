import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Box, AlertTriangle, Filter } from 'lucide-react';
import type { AuditItem, ScannedItemStatus } from '@/hooks/useArrivalAudit';
import { useCreateException } from '@/hooks/useExceptions';
import { showErrorToast, showSuccessToast } from '@/lib/errors';

interface ExpectedShipmentsListProps {
  items: AuditItem[];
}

type FilterType = 'ALL' | ScannedItemStatus;

export const ExpectedShipmentsList: React.FC<ExpectedShipmentsListProps> = ({ items }) => {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const createException = useCreateException();

  const handleMarkException = useCallback(
    async (cnNumber: string, shipmentId: string) => {
      try {
        await createException.mutateAsync({
          shipment_id: shipmentId,
          cn_number: cnNumber,
          type: 'SHORTAGE',
          severity: 'HIGH',
          description: `Missing from manifest during arrival audit. CN: ${cnNumber}`,
        });
        showSuccessToast(`Exception raised for ${cnNumber}`);
      } catch (err) {
        showErrorToast(err instanceof Error ? err : 'Failed to create exception');
      }
    },
    [createException]
  );

  const filteredItems = items.filter((i) => filter === 'ALL' || i.status === filter);

  return (
    <Card className="flex flex-col h-full border-border bg-background overflow-hidden rounded-md">
      {/* Header and Filter */}
      <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/5 z-10">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
          Consignment Tally
        </h3>

        <div className="flex bg-muted/20 border border-border p-1">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1 text-xs font-medium transition-colors rounded-sm ${filter === 'ALL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-1 text-xs font-medium transition-colors rounded-sm ${filter === 'PENDING' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('SCANNED')}
            className={`px-4 py-1 text-xs font-medium transition-colors rounded-sm ${filter === 'SCANNED' ? 'bg-status-success/20 text-status-success' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            Scanned
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground flex flex-col gap-4">
            <Filter size={32} strokeWidth={1.5} className="opacity-20" />
            <p className="text-xs uppercase tracking-widest font-mono">
              No {filter !== 'ALL' ? filter.toLowerCase() : ''} consignments found
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 pb-4">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.li
                  layout
                  key={item.shipment.cn_number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 border flex justify-between items-center ${
                    item.status === 'SCANNED'
                      ? 'bg-status-success/5 border-status-success/30'
                      : item.status === 'EXCEPTION'
                        ? 'bg-status-error/5 border-status-error/30'
                        : 'bg-background border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {item.status === 'SCANNED' ? (
                        <CheckCircle2 size={20} strokeWidth={1.5} className="text-status-success" />
                      ) : item.status === 'EXCEPTION' ? (
                        <AlertTriangle size={20} strokeWidth={1.5} className="text-status-error" />
                      ) : (
                        <Box size={20} strokeWidth={1.5} className="text-muted-foreground opacity-30" />
                      )}
                    </div>
                    <div>
                      <Link
                        to={`/shipments/${item.shipment.id}`}
                        className="font-mono font-bold text-foreground hover:text-primary transition-colors hover:underline"
                      >
                        {item.shipment.cn_number}
                      </Link>
                      <div className="text-xs text-muted-foreground flex gap-2 items-center mt-1">
                        <span className="truncate max-w-[150px]">
                          {item.shipment.consignee_name}
                        </span>
                        <span className="opacity-50">•</span>
                        <span>{item.shipment.package_count} pkgs</span>
                        <span className="opacity-50">•</span>
                        <span>{item.shipment.total_weight}kg</span>
                      </div>
                    </div>
                  </div>

                  {item.status === 'PENDING' && (
                    <button
                      onClick={() => handleMarkException(item.shipment.cn_number, item.shipment.id)}
                      disabled={createException.isPending}
                      className="text-xs text-status-error opacity-50 hover:opacity-100 transition-opacity disabled:opacity-30"
                    >
                      {createException.isPending ? 'Creating...' : 'Mark Exception'}
                    </button>
                  )}
                  {item.status === 'SCANNED' && (
                    <div className="text-xs text-status-success bg-status-success/10 px-2 py-1 rounded-sm">
                      Received
                    </div>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </Card>
  );
};
