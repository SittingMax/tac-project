/* eslint-disable @typescript-eslint/no-explicit-any -- Data mapping between Supabase and UI types */
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, CreditCard, Plus, Check, Printer, Mail, MessageCircle } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyInvoices } from '@/components/ui/empty-state';

// CRUD Components
import { CrudTable } from '@/components/crud/CrudTable';
import { CrudDeleteDialog } from '@/components/crud/CrudDeleteDialog';

// Domain Components
import { CreateInvoiceForm } from '@/components/finance/CreateInvoiceForm';
import InvoiceDetails from '@/components/finance/InvoiceDetails';
import { LabelPreviewDialog } from '@/components/domain/LabelPreviewDialog';

// Hooks & Data
import {
  useInvoices,
  useUpdateInvoiceStatus,
  useHardDeleteInvoice,
  useInvoiceByAWB,
  InvoiceWithRelations,
} from '@/hooks/useInvoices';
import { useInvoiceActions } from '@/hooks/useInvoiceActions';
import { getInvoicesColumns } from '@/components/finance/invoices.columns';
import { useAuthStore } from '@/store/authStore';

// Utils
// Utils
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Invoice, Shipment } from '@/types';

export const Finance: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Use Supabase hooks for invoices
  const { data: invoicesData = [], refetch: refetchInvoices, isLoading } = useInvoices();
  const updateStatusMutation = useUpdateInvoiceStatus();

  // Support ?awb= URL parameter for direct navigation from scanned shipments
  const awbParam = searchParams.get('CN Number');
  const { data: invoiceByAWB, isLoading: isLoadingByAWB } = useInvoiceByAWB(awbParam);
  const hardDeleteMutation = useHardDeleteInvoice();

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [successData, setSuccessData] = useState<{
    invoice: Invoice;
    shipment: Shipment | undefined;
  } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<Invoice | null>(null);

  // View detail modal state
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [viewShipment, setViewShipment] = useState<Shipment | undefined>(undefined);

  // Extracted invoice actions and formatting helpers
  const {
    labelPreviewOpen,
    setLabelPreviewOpen,
    labelPreviewData,
    handleDownloadInvoice,
    handleDownloadLabel,
    handleShareWhatsapp,
    handleShareEmail,
    buildInvoiceFromRow,
    getShipment,
    mapShipmentForLabel,
  } = useInvoiceActions();

  // Open invoice detail view
  const handleViewInvoice = async (row: any) => {
    const inv = buildInvoiceFromRow(row);
    setViewInvoice(inv);
    // Try to load shipment data for route info
    if (inv.awb) {
      try {
        const shipmentRow = await getShipment(inv.awb);
        if (shipmentRow) {
          setViewShipment(mapShipmentForLabel(shipmentRow));
        } else {
          setViewShipment(undefined);
        }
      } catch {
        setViewShipment(undefined);
      }
    } else {
      setViewShipment(undefined);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'PAID' | 'CANCELLED') => {
    if (confirm(`Mark invoice as ${status}?`)) {
      await updateStatusMutation.mutateAsync({ id, status });
    }
  };

  const onInvoiceCreated = (invoice?: Invoice, shipment?: Shipment) => {
    setIsCreateOpen(false);
    setEditingInvoice(null);
    if (invoice) {
      setSuccessData({ invoice, shipment });
    }
    refetchInvoices();
  };

  const handleDelete = async () => {
    if (!rowToDelete) return;

    if (isSuperAdmin) {
      await hardDeleteMutation.mutateAsync(rowToDelete.id);
    } else {
      await updateStatusMutation.mutateAsync({ id: rowToDelete.id, status: 'CANCELLED' });
    }

    setRowToDelete(null);
    setDeleteOpen(false);
  };

  // Auto-open invoice when navigating with ?awb= parameter (from scanned shipment)
  useEffect(() => {
    if (awbParam && invoiceByAWB && !isLoadingByAWB) {
      // Found invoice for this AWB - open it
      handleViewInvoice(invoiceByAWB);
      // Clear the URL parameter to avoid re-triggering
      setSearchParams({});
    } else if (awbParam && !isLoadingByAWB && !invoiceByAWB) {
      // No invoice found for this AWB
      toast.error(`No invoice found for shipment ${awbParam}`);
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awbParam, invoiceByAWB, isLoadingByAWB]);

  const handleEditInvoice = (row: InvoiceWithRelations) => {
    setEditingInvoice(row);
    setIsCreateOpen(true);
  };

  // Table columns with callbacks
  const columns = useMemo(
    () =>
      getInvoicesColumns({
        onEdit: (row) => handleEditInvoice(row),
        onView: (row) => handleViewInvoice(row),
        onDownload: (row) => handleDownloadInvoice(buildInvoiceFromRow(row)),
        onDownloadLabel: (row) => handleDownloadLabel(buildInvoiceFromRow(row)),
        onMarkPaid: (row) => handleStatusUpdate(row.id, 'PAID'),
        onCancel: (row) => handleStatusUpdate(row.id, 'CANCELLED'),
        onShareWhatsapp: (row) => handleShareWhatsapp(buildInvoiceFromRow(row)),
        onShareEmail: (row) => handleShareEmail(buildInvoiceFromRow(row)),
        onDelete: isSuperAdmin
          ? (row) => {
              setRowToDelete(buildInvoiceFromRow(row));
              setDeleteOpen(true);
            }
          : undefined,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, isSuperAdmin]
  );

  // Use Supabase data directly - already in correct format
  const tableData = invoicesData;

  // Stats from Supabase data - use correct DB column names
  const totalRevenue = invoicesData.reduce(
    (acc: number, inv) => acc + (inv.status === 'PAID' ? inv.total || 0 : 0),
    0
  );
  const pendingAmount = invoicesData.reduce(
    (acc: number, inv) => acc + (inv.status === 'ISSUED' ? inv.total || 0 : 0),
    0
  );
  const overdueAmount = invoicesData.reduce(
    (acc: number, inv) => acc + (inv.status === 'OVERDUE' ? inv.total || 0 : 0),
    0
  );

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24">
      <div className="flex justify-between items-end border-b border-border/40 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2.5">
            Financial Log<span className="text-primary">.</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">
            Manage invoices, billing engines, and payment gateways
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border-y border-border/40 my-8">
        <Card className="rounded-none border-0 shadow-none bg-background p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Total Ledgers
            </span>
            <FileText className="w-4 h-4 text-primary opacity-50" />
          </div>
          <div className="text-3xl font-black tracking-tighter">{invoicesData.length}</div>
        </Card>

        <Card className="rounded-none border-0 shadow-none bg-background p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-status-success">
              Revenue (Paid)
            </span>
            <CreditCard className="w-4 h-4 text-status-success opacity-50" />
          </div>
          <div
            className="text-3xl font-black tracking-tighter text-status-success truncate"
            title={formatCurrency(totalRevenue)}
          >
            {formatCurrency(totalRevenue)}
          </div>
        </Card>

        <Card className="rounded-none border-0 shadow-none bg-background p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-status-warning">
              Pending Auth
            </span>
            <FileText className="w-4 h-4 text-status-warning opacity-50" />
          </div>
          <div
            className="text-3xl font-black tracking-tighter text-status-warning truncate"
            title={formatCurrency(pendingAmount)}
          >
            {formatCurrency(pendingAmount)}
          </div>
        </Card>

        <Card className="rounded-none border-0 shadow-none bg-background p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-destructive">
              Delinquent
            </span>
            <FileText className="w-4 h-4 text-destructive opacity-50" />
          </div>
          <div
            className="text-3xl font-black tracking-tighter text-destructive truncate"
            title={formatCurrency(overdueAmount)}
          >
            {formatCurrency(overdueAmount)}
          </div>
        </Card>
      </div>

      {/* Table with CRUD */}
      <CrudTable
        columns={columns}
        data={tableData}
        searchKey="invoice_no"
        searchPlaceholder="Search invoices..."
        isLoading={isLoading}
        emptyState={<EmptyInvoices onCreate={() => setIsCreateOpen(true)} />}
        emptyMessage="No invoices found."
        toolbar={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-none font-mono text-xs uppercase tracking-widest px-8"
          >
            <Plus className="w-4 h-4 mr-2" /> Init Ledger
          </Button>
        }
      />

      {/* Create Invoice Modal */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingInvoice(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice
                ? `Edit Invoice ${editingInvoice.invoice_no}`
                : 'Generate New Invoice'}
            </DialogTitle>
          </DialogHeader>
          <CreateInvoiceForm
            onSuccess={onInvoiceCreated}
            onCancel={() => {
              setIsCreateOpen(false);
              setEditingInvoice(null);
            }}
            initialData={editingInvoice || undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog
        open={!!successData}
        onOpenChange={(open) => {
          if (!open) setSuccessData(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice Created Successfully</DialogTitle>
          </DialogHeader>
          {successData && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-status-success/10 rounded-none flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-status-success" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Ready for Dispatch</h3>
                <p className="text-muted-foreground text-sm">
                  Invoice {successData.invoice.invoiceNumber} and AWB {successData.invoice.awb}{' '}
                  generated.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button size="lg" onClick={(e) => handleDownloadInvoice(successData.invoice, e)}>
                  <FileText className="w-5 h-5 mr-2" /> Download Invoice
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={(e) => handleDownloadLabel(successData.invoice, e)}
                >
                  <Printer className="w-5 h-5 mr-2" /> Print Label
                </Button>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-3 uppercase font-bold tracking-wider">
                  Share with Customer
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="ghost"
                    className="text-status-success border border-status-success/30 hover:bg-status-success/10"
                    onClick={() => handleShareWhatsapp(successData.invoice)}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-status-info border border-status-info/30 hover:bg-status-info/10"
                    onClick={() => handleShareEmail(successData.invoice)}
                  >
                    <Mail className="w-5 h-5 mr-2" /> Email
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Detail View Modal */}
      <Dialog
        open={!!viewInvoice}
        onOpenChange={(open) => {
          if (!open) {
            setViewInvoice(null);
            setViewShipment(undefined);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <InvoiceDetails
              invoice={viewInvoice}
              shipment={viewShipment}
              onClose={() => {
                setViewInvoice(null);
                setViewShipment(undefined);
              }}
              onDownloadInvoice={handleDownloadInvoice}
              onDownloadLabel={handleDownloadLabel}
              onMarkPaid={(id) => handleStatusUpdate(id, 'PAID')}
              onCancel={(id) => handleStatusUpdate(id, 'CANCELLED')}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <CrudDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={isSuperAdmin ? 'Permanently Delete Invoice?' : 'Cancel invoice?'}
        description={
          isSuperAdmin
            ? `This will PERMANENTLY delete invoice "${rowToDelete?.invoiceNumber ?? ''}". This action cannot be undone.`
            : `This will cancel invoice "${rowToDelete?.invoiceNumber ?? ''}".`
        }
        onConfirm={handleDelete}
        confirmLabel={isSuperAdmin ? 'Delete Permanently' : 'Cancel Invoice'}
      />

      {/* Inline Label Preview Dialog */}
      <LabelPreviewDialog
        shipmentData={labelPreviewData}
        open={labelPreviewOpen}
        onOpenChange={setLabelPreviewOpen}
      />
    </div>
  );
};
