'use client';

import React from 'react';
import { Invoice, Shipment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';
import { NotesPanel } from '@/components/domain/NotesPanel';
import {
  FileText,
  Printer,
  X,
  CreditCard,
  Calendar,
  User,
  Truck,
  Plane,
  MapPin,
  MessageCircle,
  Mail,
  ExternalLink,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { HUBS } from '@/lib/constants';
import { toast } from 'sonner';

// Status styles using semantic badge classes from globals.css
const STATUS_STYLES: Record<string, string> = {
  PAID: 'badge--delivered',
  ISSUED: 'badge--manifested',
  OVERDUE: 'badge--exception',
  DRAFT: 'badge--cancelled',
  CANCELLED: 'badge--cancelled',
};

interface InvoiceDetailsProps {
  invoice: Invoice;
  shipment?: Shipment;
  onClose: () => void;
  onDownloadInvoice: (inv: Invoice) => void;
  onDownloadLabel: (inv: Invoice) => void;
  onMarkPaid?: (id: string) => void;
  onCancel?: (id: string) => void;
  currentUserId?: string;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoice,
  shipment,
  onClose,
  onDownloadInvoice,
  onDownloadLabel,
  onMarkPaid,
  onCancel,
  currentUserId = 'System',
}) => {
  const origin = shipment ? HUBS[shipment.originHub] : null;
  const dest = shipment ? HUBS[shipment.destinationHub] : null;

  const handleCopyAwb = () => {
    if (invoice.awb) {
      navigator.clipboard.writeText(invoice.awb);
      toast.success('CN copied to clipboard');
    }
  };

  const handleShareWhatsapp = () => {
    const message = `Invoice ${invoice.invoiceNumber} | awb: ${invoice.awb} | Amount: ₹${invoice.financials.totalAmount.toLocaleString('en-IN')} | Status: ${invoice.status}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`;
    const body = `Dear Customer,\n\nPlease find your invoice details below:\n\nInvoice: ${invoice.invoiceNumber}\nCN: ${invoice.awb}\nAmount: ₹${invoice.financials.totalAmount.toLocaleString('en-IN')}\nStatus: ${invoice.status}\nDue Date: ${invoice.dueDate?.split('T')[0] || 'N/A'}\n\nThank you for choosing TAC Cargo.`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleTrackShipment = () => {
    if (invoice.awb) {
      window.open(`/track/${invoice.awb}`, '_blank');
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold font-mono text-foreground">
                {invoice.invoiceNumber}
              </h2>
              <Badge className={STATUS_STYLES[invoice.status]}>{invoice.status}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-muted-foreground">
                awb: <span className="font-mono">{invoice.awb || '—'}</span>
              </p>
              {invoice.awb && (
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleCopyAwb}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy AWB</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleTrackShipment}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Track Shipment</TooltipContent>
                  </Tooltip>
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                • Created {invoice.createdAt?.split('T')[0]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => onDownloadInvoice(invoice)} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" /> Invoice PDF
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download Invoice as PDF</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => onDownloadLabel(invoice)} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" /> Label
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print Shipping Label</TooltipContent>
          </Tooltip>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer & Shipment Info */}
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" /> Customer
                </h3>
                <div className="text-sm font-medium text-foreground">{invoice.customerName}</div>
                <div className="text-xs text-muted-foreground mt-1">ID: {invoice.customerId}</div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Payment
                </h3>
                <div className="text-sm font-medium">{invoice.paymentMode}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Due: {invoice.dueDate?.split('T')[0] || '—'}
                </div>
              </div>
            </div>
          </Card>

          {/* Route Info */}
          {shipment && origin && dest && (
            <Card className="p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Route
              </h3>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{origin.code}</div>
                  <div className="text-xs text-muted-foreground">{origin.name}</div>
                </div>
                <div className="flex-1 px-4 flex flex-col items-center">
                  <div className="w-full h-0.5 bg-border relative">
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-none bg-muted-foreground" />
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-none bg-primary" />
                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-card px-2">
                      {shipment.mode === 'AIR' ? (
                        <Plane className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Truck className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">{dest.code}</div>
                  <div className="text-xs text-muted-foreground">{dest.name}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-border mt-4 pt-4">
                <div>
                  <div className="text-xs text-muted-foreground">Service</div>
                  <div className="font-bold text-sm">{shipment.serviceLevel}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Weight</div>
                  <div className="font-bold text-sm">{shipment.totalWeight.chargeable} kg</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Packages</div>
                  <div className="font-bold text-sm">{shipment.totalPackageCount}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Financial Breakdown */}
          <Card className="p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> Financial Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Freight</span>
                <span className="font-mono">{formatCurrency(invoice.financials.baseFreight)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Docket Charge</span>
                <span className="font-mono">{formatCurrency(invoice.financials.docketCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup Charge</span>
                <span className="font-mono">{formatCurrency(invoice.financials.pickupCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Packing Charge</span>
                <span className="font-mono">
                  {formatCurrency(invoice.financials.packingCharge)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Surcharge</span>
                <span className="font-mono">
                  {formatCurrency(invoice.financials.fuelSurcharge)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Handling Fee</span>
                <span className="font-mono">{formatCurrency(invoice.financials.handlingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance</span>
                <span className="font-mono">{formatCurrency(invoice.financials.insurance)}</span>
              </div>
              {invoice.financials.discount > 0 && (
                <div className="flex justify-between text-status-success">
                  <span>Discount</span>
                  <span className="font-mono">-{formatCurrency(invoice.financials.discount)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span className="font-mono">{formatCurrency(invoice.financials.tax.total)}</span>
                </div>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="font-mono text-primary">
                    {formatCurrency(invoice.financials.totalAmount)}
                  </span>
                </div>
                {invoice.financials.advancePaid > 0 && (
                  <>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Advance Paid</span>
                      <span className="font-mono text-status-success">
                        -{formatCurrency(invoice.financials.advancePaid)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold mt-1">
                      <span>Balance Due</span>
                      <span className="font-mono">
                        {formatCurrency(invoice.financials.balance)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Notes & Actions */}
        <div className="space-y-4">
          {/* Share Actions */}
          <Card className="p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">
              Share Invoice
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-status-success border-status-success/30 hover:bg-status-success/10"
                onClick={handleShareWhatsapp}
              >
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-status-info border-status-info/30 hover:bg-status-info/10"
                onClick={handleShareEmail}
              >
                <Mail className="w-4 h-4 mr-2" /> Email
              </Button>
            </div>
          </Card>

          <NotesPanel
            entityType="INVOICE"
            entityId={invoice.id}
            title="Invoice Notes"
            currentUserId={currentUserId}
            maxHeight="400px"
          />

          {/* Quick Actions */}
          {invoice.status === 'ISSUED' && (
            <Card className="p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {onMarkPaid && (
                  <Button className="w-full" onClick={() => onMarkPaid(invoice.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Paid
                  </Button>
                )}
                {onCancel && (
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => onCancel(invoice.id)}
                  >
                    Cancel Invoice
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default InvoiceDetails;
