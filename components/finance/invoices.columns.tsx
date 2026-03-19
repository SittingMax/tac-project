'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CrudRowActions } from '@/components/crud/CrudRowActions';
import { StatusBadge, type StatusVariant } from '@/components/domain/status-badge';
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
import { formatDate } from '@/lib/formatters';

// Status color mapping using semantic badge classes
const STATUS_COLORS: Record<string, StatusVariant> = {
  PAID: 'PAID',
  ISSUED: 'ISSUED',
  OVERDUE: 'OVERDUE',
  DRAFT: 'CANCELLED',
  CANCELLED: 'CANCELLED',
};

// Amount color based on status
const AMOUNT_STATUS_COLORS: Record<string, string> = {
  PAID: 'text-status-success',
  ISSUED: 'text-status-warning',
  OVERDUE: 'text-status-error',
  DRAFT: 'text-muted-foreground',
  CANCELLED: 'text-muted-foreground line-through',
};

const getInvoiceAwb = (row: InvoiceWithRelations) => {
  if (row.shipment?.cn_number) {
    return row.shipment.cn_number;
  }

  if (!row.line_items || typeof row.line_items !== 'object' || Array.isArray(row.line_items)) {
    return '';
  }

  const awb = row.line_items.awb;
  return typeof awb === 'string' ? awb : '';
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
          onClick={(e) => {
            e.stopPropagation();
            params.onView(row.original);
          }}
        >
          <IdBadge
            entity="invoice"
            idValue={row.original.id}
            cnNumber={row.original.invoice_no}
            className="cursor-pointer"
          />
        </div>
      ),
    },
    {
      accessorKey: 'CN Number',
      header: 'CN Number',
      accessorFn: (row) => getInvoiceAwb(row),
      cell: ({ row }) => {
        const awb = getInvoiceAwb(row.original);
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
          <div className="text-right">
            <div className={`font-bold text-lg ${statusColor}`}>
              ₹{row.original.total?.toLocaleString('en-IN') ?? '0'}
            </div>
            <div className="text-xs text-muted-foreground">
              Tax: ₹{(row.original.tax_amount ?? 0).toLocaleString('en-IN')}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.due_date ? formatDate(row.original.due_date) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={STATUS_COLORS[row.original.status] || 'NEUTRAL'}>
          {row.original.status}
        </StatusBadge>
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
                  <Download size={16} strokeWidth={1.5} />
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
                  <Printer size={16} strokeWidth={1.5} />
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
                    <Trash2 size={16} strokeWidth={1.5} />
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
                  icon: <Eye size={16} strokeWidth={1.5} />,
                  onClick: () => params.onView(row.original),
                },
                {
                  label: 'Download Invoice',
                  icon: <Download size={16} strokeWidth={1.5} />,
                  onClick: () => params.onDownload(row.original),
                },
                {
                  label: 'Print Label',
                  icon: <Printer size={16} strokeWidth={1.5} />,
                  onClick: () => params.onDownloadLabel(row.original),
                },
                ...(params.onShareWhatsapp
                  ? [
                      {
                        label: 'Share WhatsApp',
                        icon: <MessageCircle size={16} strokeWidth={1.5} />,
                        onClick: () => params.onShareWhatsapp!(row.original),
                      },
                    ]
                  : []),
                ...(params.onShareEmail
                  ? [
                      {
                        label: 'Share Email',
                        icon: <Mail size={16} strokeWidth={1.5} />,
                        onClick: () => params.onShareEmail!(row.original),
                      },
                    ]
                  : []),
                ...(row.original.status === 'ISSUED'
                  ? [
                      {
                        label: 'Mark as Paid',
                        icon: <CheckCircle size={16} strokeWidth={1.5} />,
                        onClick: () => params.onMarkPaid(row.original),
                      },
                      {
                        label: 'Cancel',
                        icon: <XCircle size={16} strokeWidth={1.5} />,
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
