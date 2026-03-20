'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CrudRowActions } from '@/components/crud/CrudRowActions';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  CheckCircle,
  XCircle,
  Printer,
  Eye,
  MessageCircle,
  Mail,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InvoiceWithRelations } from '@/hooks/useInvoices';
import { IdBadge } from '@/components/ui-core/data/id-badge';

// Status color mapping using semantic badge classes
const STATUS_COLORS: Record<string, string> = {
  PAID: 'badge--delivered',
  ISSUED: 'badge--manifested',
  OVERDUE: 'badge--exception',
  DRAFT: 'badge--cancelled',
  CANCELLED: 'badge--cancelled',
};

// Amount color based on status
const AMOUNT_STATUS_COLORS: Record<string, string> = {
  PAID: 'text-status-success',
  ISSUED: 'text-status-warning',
  OVERDUE: 'text-status-error',
  DRAFT: 'text-muted-foreground',
  CANCELLED: 'text-muted-foreground line-through',
};

export interface InvoicesColumnsParams {
  onEdit: (row: InvoiceWithRelations) => void;
  onView: (row: InvoiceWithRelations) => void;
  onDownload: (row: InvoiceWithRelations) => void;
  onDownloadLabel: (row: InvoiceWithRelations) => void;
  onMarkPaid: (row: InvoiceWithRelations) => void;
  onCancel: (row: InvoiceWithRelations) => void;
  onDelete?: (row: InvoiceWithRelations) => void;
  onShareWhatsapp?: (row: InvoiceWithRelations) => void;
  onShareEmail?: (row: InvoiceWithRelations) => void;
}

/**
 * Generate column definitions for the invoices table.
 * Includes callbacks for view, download, label print, status updates, and delete actions.
 */
export function getInvoicesColumns(
  params: InvoicesColumnsParams
): ColumnDef<InvoiceWithRelations>[] {
  return [
    {
      accessorKey: 'invoice_no',
      header: 'Invoice',
      cell: ({ row }) => (
        <div
          className="cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            params.onView(row.original);
          }}
        >
          <IdBadge
            entity="invoice"
            idValue={row.original.id}
            cnNumber={row.original.invoice_no}
            className="group-hover:text-primary transition-colors"
          />
        </div>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = Array.isArray(row.original.line_items) ? row.original.line_items : [];
        const mainDesc = items.length > 0 ? items[0].description || items[0].name : 'Standard Freight';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground text-sm truncate max-w-[180px]" title={mainDesc}>{mainDesc || 'Services rendered'}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              {items.length > 1 ? `+${items.length - 1} MORE ITEM${items.length > 2 ? 'S' : ''}` : '1 ITEM'}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'CN Number',
      header: 'CN Number',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accessorFn: (row) => row.shipment?.cn_number || (row.line_items as any)?.awb || '',
      cell: ({ row }) => {
        const awb =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          row.original.shipment?.cn_number || (row.original.line_items as any)?.awb || '';
        return awb ? (
          <IdBadge entity="shipment" idValue={awb} cnNumber={awb} />
        ) : (
          <span className="text-xs text-muted-foreground italic">—</span>
        );
      },
      enableGlobalFilter: true,
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="font-medium text-foreground">{row.original.customer?.name || '—'}</div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Amount',
      cell: ({ row }) => {
        const statusColor = AMOUNT_STATUS_COLORS[row.original.status] || 'text-foreground';
        return (
          <div className="text-right flex flex-col items-end">
            <div className={`font-mono font-bold text-sm ${statusColor}`}>
              ₹{row.original.total?.toLocaleString('en-IN') ?? '0'}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              TAX: ₹{(row.original.tax_amount ?? 0).toLocaleString('en-IN')}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => {
        const isOverdue = row.original.status === 'OVERDUE';
        const dateText = row.original.due_date ? new Date(row.original.due_date).toLocaleDateString('en-IN') : '—';
        return (
          <span className={`font-mono text-xs ${isOverdue ? 'text-destructive font-bold bg-destructive/10 px-1.5 py-0.5 rounded' : 'text-muted-foreground'}`}>
            {dateText}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={`${STATUS_COLORS[row.original.status] || STATUS_COLORS.DRAFT}`}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => params.onDownload(row.original)}>
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download Invoice</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => params.onDownloadLabel(row.original)}
                >
                  <Printer className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print Label</TooltipContent>
            </Tooltip>

            {params.onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => params.onDelete!(row.original)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Permanently</TooltipContent>
              </Tooltip>
            )}

            <CrudRowActions
              onEdit={() => params.onEdit(row.original)}
              extraItems={[
                {
                  label: 'View Details',
                  icon: <Eye className="w-4 h-4" />,
                  onClick: () => params.onView(row.original),
                },
                {
                  label: 'Download Invoice',
                  icon: <Download className="w-4 h-4" />,
                  onClick: () => params.onDownload(row.original),
                },
                {
                  label: 'Print Label',
                  icon: <Printer className="w-4 h-4" />,
                  onClick: () => params.onDownloadLabel(row.original),
                },
                ...(params.onShareWhatsapp
                  ? [
                      {
                        label: 'Share WhatsApp',
                        icon: <MessageCircle className="w-4 h-4" />,
                        onClick: () => params.onShareWhatsapp!(row.original),
                      },
                    ]
                  : []),
                ...(params.onShareEmail
                  ? [
                      {
                        label: 'Share Email',
                        icon: <Mail className="w-4 h-4" />,
                        onClick: () => params.onShareEmail!(row.original),
                      },
                    ]
                  : []),
                ...(row.original.status === 'ISSUED'
                  ? [
                      {
                        label: 'Mark as Paid',
                        icon: <CheckCircle className="w-4 h-4" />,
                        onClick: () => params.onMarkPaid(row.original),
                      },
                      {
                        label: 'Cancel',
                        icon: <XCircle className="w-4 h-4" />,
                        onClick: () => params.onCancel(row.original),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </TooltipProvider>
      ),
    },
  ];
}
