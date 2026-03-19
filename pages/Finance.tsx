import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, CreditCard, Plus, Check, Printer, Mail, MessageCircle } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyInvoices } from '@/components/ui/empty-state';
import { PageHeader, PageContainer, SectionCard, SizedDialog, AppIcon } from '@/components/ui-core';

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
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Invoice, Shipment } from '@/types';

export const Finance: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: invoicesData = [], refetch: refetchInvoices, isLoading } = useInvoices();
  const updateStatusMutation = useUpdateInvoiceStatus();

  const actionParam = searchParams.get('action') || '';
  const awbParam = searchParams.get('awb') || searchParams.get('CN Number');
  const shouldOpenCreateModal = actionParam === 'create';
  const { data: invoiceByAWB, isLoading: isLoadingByAWB } = useInvoiceByAWB(awbParam);
  const hardDeleteMutation = useHardDeleteInvoice();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [successData, setSuccessData] = useState<{
    invoice: Invoice;
    shipment: Shipment | undefined;
  } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [viewShipment, setViewShipment] = useState<Shipment | undefined>(undefined);

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

  const handleViewInvoice = async (row: InvoiceWithRelations) => {
    const inv = buildInvoiceFromRow(row);
    setViewInvoice(inv);
    if (inv.awb) {
      try {
        const shipmentRow = await getShipment(inv.awb);
        setViewShipment(shipmentRow ? mapShipmentForLabel(shipmentRow) : undefined);
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

  const clearCreateActionParam = () => {
    if (searchParams.get('action') === 'create') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleCreateModalChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setEditingInvoice(null);
      clearCreateActionParam();
    }
  };

  const onInvoiceCreated = (invoice?: Invoice, shipment?: Shipment) => {
    handleCreateModalChange(false);
    if (invoice) setSuccessData({ invoice, shipment });
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

  useEffect(() => {
    if (awbParam && invoiceByAWB && !isLoadingByAWB) {
      handleViewInvoice(invoiceByAWB);
      setSearchParams({});
    } else if (awbParam && !isLoadingByAWB && !invoiceByAWB) {
      toast.error(`No invoice found for shipment ${awbParam}`);
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awbParam, invoiceByAWB, isLoadingByAWB]);

  useEffect(() => {
    if (shouldOpenCreateModal) {
      setEditingInvoice(null);
      setIsCreateOpen(true);
    }
  }, [shouldOpenCreateModal]);

  const handleEditInvoice = (row: InvoiceWithRelations) => {
    setEditingInvoice(row);
    setIsCreateOpen(true);
  };

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
    <PageContainer>
      <PageHeader
        title="Finance"
        description="Manage invoices, billing records, and shipment documents"
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <AppIcon icon={Plus} size={16} className="mr-2" />
          New Invoice
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between flex flex-col gap-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
            <AppIcon icon={FileText} size={16} className="text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{invoicesData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between flex flex-col gap-0 pb-2">
            <CardTitle className="text-sm font-medium text-status-success">
              Revenue (Paid)
            </CardTitle>
            <AppIcon icon={CreditCard} size={16} className="text-status-success opacity-50" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-semibold text-status-success truncate"
              title={formatCurrency(totalRevenue)}
            >
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between flex flex-col gap-0 pb-2">
            <CardTitle className="text-sm font-medium text-status-warning">Pending</CardTitle>
            <AppIcon icon={FileText} size={16} className="text-status-warning opacity-50" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-semibold text-status-warning truncate"
              title={formatCurrency(pendingAmount)}
            >
              {formatCurrency(pendingAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between flex flex-col gap-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
            <AppIcon icon={FileText} size={16} className="text-destructive opacity-50" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-semibold text-destructive truncate"
              title={formatCurrency(overdueAmount)}
            >
              {formatCurrency(overdueAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table with CRUD */}
      <SectionCard>
        <CrudTable
          columns={columns}
          data={invoicesData}
          isLoading={isLoading}
          searchKey="invoices"
          searchPlaceholder="Search invoices..."
          emptyState={<EmptyInvoices onCreate={() => setIsCreateOpen(true)} />}
          emptyMessage="No invoices found."
        />
      </SectionCard>

      {/* Create Invoice Modal */}
      <SizedDialog
        open={isCreateOpen}
        onOpenChange={handleCreateModalChange}
        size="5xl"
        title={
          editingInvoice ? `Edit Invoice ${editingInvoice.invoice_no}` : 'Generate New Invoice'
        }
        description="Fill in the details to create a new invoice."
      >
        <CreateInvoiceForm
          onSuccess={onInvoiceCreated}
          onCancel={() => handleCreateModalChange(false)}
          initialData={editingInvoice || undefined}
        />
      </SizedDialog>

      {/* Success Modal */}
      <SizedDialog
        open={!!successData}
        onOpenChange={(open) => {
          if (!open) setSuccessData(null);
        }}
        size="sm"
        title="Documents Created Successfully"
      >
        {successData && (
          <div className="text-center flex flex-col gap-6">
            <div className="size-16 bg-status-success/10 rounded-xl flex items-center justify-center mx-auto">
              <AppIcon icon={Check} size={32} className="text-status-success" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Documents Ready</h3>
              <p className="text-muted-foreground text-sm">
                Invoice {successData.invoice.invoiceNumber} and shipment document{' '}
                {successData.invoice.awb} are available for download.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button size="lg" onClick={(e) => handleDownloadInvoice(successData.invoice, e)}>
                <AppIcon icon={FileText} size={16} className="mr-2" /> Download Invoice
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={(e) => handleDownloadLabel(successData.invoice, e)}
              >
                <AppIcon icon={Printer} size={16} className="mr-2" /> Print Label
              </Button>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Share with Customer</p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="ghost"
                  className="text-status-success border border-status-success/30 hover:bg-status-success/10"
                  onClick={() => handleShareWhatsapp(successData.invoice)}
                >
                  <AppIcon icon={MessageCircle} size={16} className="mr-2" /> WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  className="text-status-info border border-status-info/30 hover:bg-status-info/10"
                  onClick={() => handleShareEmail(successData.invoice)}
                >
                  <AppIcon icon={Mail} size={16} className="mr-2" /> Email
                </Button>
              </div>
            </div>
          </div>
        )}
      </SizedDialog>

      {/* Invoice Detail View Modal */}
      <SizedDialog
        open={!!viewInvoice}
        onOpenChange={(open) => {
          if (!open) {
            setViewInvoice(null);
            setViewShipment(undefined);
          }
        }}
        size="lg"
        title="Invoice Details"
      >
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
      </SizedDialog>

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
    </PageContainer>
  );
};
