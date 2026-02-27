import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { generateEnterpriseInvoice } from '@/lib/pdf-generator';
import { generateLabelFromShipment } from '@/lib/utils/label-utils';
import { formatCurrency } from '@/lib/utils';
import { sanitizeString } from '@/lib/utils/sanitize';
import { HUBS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { HubLocation, Invoice, Shipment, ShipmentMode, ServiceLevel, PaymentMode } from '@/types';
import { LabelData } from '@/components/domain/LabelGenerator';

export function useInvoiceActions() {
  const [labelDownloading, setLabelDownloading] = useState(false);
  const [labelPreviewOpen, setLabelPreviewOpen] = useState(false);
  const [labelPreviewData, setLabelPreviewData] = useState<Partial<LabelData> | undefined>(
    undefined
  );

  const getShipment = async (awb: string) => {
    const { data, error } = await supabase
      .from('shipments')
      .select(
        `*, customer:customers(name, email), origin_hub:hubs!shipments_origin_hub_id_fkey(code), destination_hub:hubs!shipments_destination_hub_id_fkey(code)`
      )
      .eq('cn_number', awb)
      .maybeSingle();

    if (error) {
      console.warn('Shipment fetch error:', error);
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatAddress = (address: any) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    const { line1, line2, city, state, zip } = address as Record<string, string | undefined>;
    return [line1, line2, city, state, zip].filter(Boolean).join(', ');
  };

  const formatInvoiceDateTag = (dateInput?: string) => {
    const date = dateInput ? new Date(dateInput) : new Date();
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
    return safeDate.toISOString().slice(0, 10).replace(/-/g, '');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildInvoiceFilename = (inv: Invoice, consignor: any, consignee: any) => {
    const rawName = sanitizeString(
      inv.customerName || consignee?.name || consignor?.name || 'Customer'
    );
    const safeName = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const dateTag = formatInvoiceDateTag(inv.createdAt);
    return `INVOICE-${safeName || 'customer'}-${dateTag}.pdf`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolveHubLocation = (row: any, type: 'origin' | 'destination'): HubLocation => {
    const hubId = type === 'origin' ? row.origin_hub_id : row.destination_hub_id;
    const hubCode = type === 'origin' ? row.origin_hub?.code : row.destination_hub?.code;
    const byUuid = Object.values(HUBS).find((hub) => hub.uuid === hubId)?.id;
    const byCode = Object.values(HUBS).find((hub) => hub.code === hubCode)?.id;
    return (byUuid || byCode || 'IMPHAL') as HubLocation;
  };

  const resolveMode = (value?: string | null): ShipmentMode => {
    if (!value) return 'TRUCK';
    return value.toUpperCase() === 'AIR' ? 'AIR' : 'TRUCK';
  };

  const resolveServiceLevel = (value?: string | null): ServiceLevel => {
    if (!value) return 'STANDARD';
    const upper = value.toUpperCase();
    if (upper === 'EXPRESS' || upper === 'PRIORITY' || upper === 'STANDARD') {
      return upper as ServiceLevel;
    }
    return 'STANDARD';
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapShipmentForLabel = (row: any): Shipment => {
    const originHub = resolveHubLocation(row, 'origin');
    const destinationHub = resolveHubLocation(row, 'destination');
    const weight = Number(row.total_weight ?? 0);

    return {
      id: row.id,
      awb: row.cn_number || row.awb,
      customerId: row.customer_id,
      customerName: row.customer?.name || row.consignee_name || 'Unknown',
      originHub,
      destinationHub,
      mode: resolveMode(row.mode),
      serviceLevel: resolveServiceLevel(row.service_level),
      totalPackageCount: row.total_packages ?? 1,
      totalWeight: { dead: weight, volumetric: 0, chargeable: weight },
      status: row.status ?? 'CREATED',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
      eta: 'TBD',
      consignor: {
        name: row.consignor_name || 'CONSIGNOR',
        phone: row.consignor_phone || '',
        address: formatAddress(row.consignor_address),
      },
      consignee: {
        name: row.consignee_name || 'CONSIGNEE',
        phone: row.consignee_phone || '',
        address: formatAddress(row.consignee_address),
      },
      contentsDescription: row.contents || 'General Cargo',
      paymentMode: (row.payment_mode as PaymentMode) || 'TO_PAY',
    };
  };

  const buildShipmentFromInvoice = (inv: Invoice): Shipment => {
    logger.debug('[Label] Building shipment from invoice', { id: inv.id, awb: inv.awb });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems = (inv as any).line_items || (inv as any).financials || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const consignor = lineItems.consignor || (inv as any).consignor || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const consignee = lineItems.consignee || (inv as any).consignee || {};

    return {
      id: inv.id,
      awb: inv.awb || '',
      customerId: inv.customerId || '',
      customerName: consignee.name || inv.customerName || 'Unknown',
      originHub: 'NEW_DELHI' as HubLocation,
      destinationHub: 'IMPHAL' as HubLocation,
      mode: (lineItems.transportMode as ShipmentMode) || 'TRUCK',
      serviceLevel: 'STANDARD' as ServiceLevel,
      totalPackageCount: 1,
      totalWeight: { dead: 0, volumetric: 0, chargeable: 0 },
      status: 'CREATED',
      createdAt: inv.createdAt || new Date().toISOString(),
      updatedAt: inv.createdAt || new Date().toISOString(),
      eta: 'TBD',
      consignor: {
        name: consignor.name || 'CONSIGNOR',
        phone: consignor.phone || '',
        address: consignor.address || '',
        city: consignor.city,
        state: consignor.state,
      },
      consignee: {
        name: consignee.name || 'CONSIGNEE',
        phone: consignee.phone || '',
        address: consignee.address || '',
        city: consignee.city,
        state: consignee.state,
      },
      contentsDescription: 'General Cargo',
      paymentMode: (inv.paymentMode as PaymentMode) || 'TO_PAY',
    };
  };

  const handleDownloadInvoice = async (inv: Invoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      toast.info('Generating invoice PDF...');
      const shipmentRow = inv.awb ? await getShipment(inv.awb) : null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lineItems = (inv as any).line_items || (inv as any).financials || {};

      const consignor = shipmentRow
        ? {
          name: shipmentRow.consignor_name,
          phone: shipmentRow.consignor_phone,
          address: formatAddress(shipmentRow.consignor_address),
        }
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lineItems.consignor || (inv as any).consignor || {};
      const consignee = shipmentRow
        ? {
          name: shipmentRow.consignee_name,
          phone: shipmentRow.consignee_phone,
          address: formatAddress(shipmentRow.consignee_address),
        }
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lineItems.consignee || (inv as any).consignee || {};

      const fullInvoice = { ...inv, consignor, consignee };
      const url = await generateEnterpriseInvoice(fullInvoice as Invoice);

      const link = document.createElement('a');
      link.href = url;
      link.download = buildInvoiceFilename(inv, consignor, consignee);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Invoice downloaded!');
    } catch (error) {
      console.error('[Invoice] Invoice generation error:', error);
      toast.error('Failed to generate invoice PDF');
    }
  };

  const handleDownloadLabel = async (inv: Invoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (labelDownloading) return;
    setLabelDownloading(true);
    try {
      toast.info('Preparing label preview...');
      let shipment: Shipment | null = null;
      if (inv.awb) {
        const shipmentRow = await getShipment(inv.awb);
        if (shipmentRow) shipment = mapShipmentForLabel(shipmentRow);
      }
      if (!shipment) shipment = buildShipmentFromInvoice(inv);

      const labelData = generateLabelFromShipment(shipment, inv);
      setLabelPreviewData(labelData);
      setLabelPreviewOpen(true);
    } catch (error) {
      console.error('Label error:', error);
      toast.error('Failed to generate label');
    } finally {
      setTimeout(() => setLabelDownloading(false), 1000);
    }
  };

  const handleShareWhatsapp = async (inv: Invoice) => {
    const shipment = inv.awb ? await getShipment(inv.awb) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const phone =
      (inv as any).consignee?.phone ||
      (inv as any).line_items?.consignee?.phone ||
      (shipment as any)?.consignee_phone ||
      '';
    if (!phone) {
      alert('No customer phone number found.');
      return;
    }
    const text = `Hello, here is your invoice ${inv.invoiceNumber} for shipment CN ${inv.awb}.
Amount: ${formatCurrency(inv.financials.totalAmount)}
Status: ${inv.status}
Track your shipment here: https://taccargo.com/track/${inv.awb}
Thank you for choosing TAC Cargo.`;
    const url = `https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = async (inv: Invoice) => {
    const shipment = inv.awb ? await getShipment(inv.awb) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const email = (shipment as any)?.customer?.email || '';
    const subject = `Invoice ${inv.invoiceNumber} - TAC Cargo`;
    const body = `Dear Customer,%0D%0A%0D%0APlease find details for invoice ${inv.invoiceNumber} related to shipment ${inv.awb}.%0D%0A%0D%0AAmount: ${formatCurrency(inv.financials.totalAmount)}%0D%0A%0D%0AThank you,%0D%0ATAC Cargo Team`;
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  // Helper to build Invoice object from DB row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildInvoiceFromRow = (row: any): Invoice => {
    const lineItems = row.line_items || {};
    const awb = row.shipment?.cn_number || lineItems.awb || '';
    const tax = lineItems.tax ?? { cgst: 0, sgst: 0, igst: 0, total: row.tax_amount ?? 0 };

    return {
      id: row.id,
      invoiceNumber: row.invoice_no,
      customerId: row.customer_id,
      customerName: row.customer?.name || 'Unknown',
      shipmentId: row.shipment_id || '',
      awb,
      status: row.status,
      createdAt: row.created_at,
      dueDate: row.due_date || '',
      paymentMode: lineItems.paymentMode || 'PAID',
      financials: {
        ratePerKg: lineItems.ratePerKg ?? 0,
        baseFreight: lineItems.baseFreight ?? row.subtotal ?? 0,
        docketCharge: lineItems.docketCharge ?? 0,
        pickupCharge: lineItems.pickupCharge ?? 0,
        packingCharge: lineItems.packingCharge ?? 0,
        fuelSurcharge: lineItems.fuelSurcharge ?? 0,
        handlingFee: lineItems.handlingFee ?? 0,
        insurance: lineItems.insurance ?? 0,
        tax,
        discount: lineItems.discount ?? row.discount ?? 0,
        totalAmount: row.total ?? 0,
        advancePaid: lineItems.advancePaid ?? 0,
        balance: lineItems.balance ?? row.total ?? 0,
      },
      ...(Object.keys(lineItems).length > 0 ? { line_items: lineItems } : {}),
    } as Invoice;
  };

  return {
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
  };
}
