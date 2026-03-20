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

type ShipmentLookupRow = {
  id: string;
  cn_number?: string | null;
  awb?: string | null;
  customer_id?: string | null;
  customer?: { name?: string | null; email?: string | null } | null;
  origin_hub_id?: string | null;
  destination_hub_id?: string | null;
  origin_hub?: { code?: string | null } | null;
  destination_hub?: { code?: string | null } | null;
  total_weight?: number | null;
  mode?: string | null;
  service_level?: string | null;
  total_packages?: number | null;
  status?: Shipment['status'] | null;
  created_at?: string | null;
  updated_at?: string | null;
  consignor_name?: string | null;
  consignor_phone?: string | null;
  consignor_address?: unknown;
  consignee_name?: string | null;
  consignee_phone?: string | null;
  consignee_address?: unknown;
  payment_mode?: string | null;
  contents?: string | null;
};

type PartyNameLike = { name?: string | null } | null | undefined;
type PartyDetails = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
};
type InvoiceRowLike = {
  id: string;
  invoice_no: string;
  customer_id: string;
  shipment_id?: string | null;
  status: Invoice['status'];
  created_at: string;
  due_date?: string | null;
  customer?: { name?: string | null } | null;
  shipment?: { cn_number?: string | null } | null;
  line_items?: unknown;
  tax_amount?: number | null;
  subtotal?: number | null;
  discount?: number | null;
  total?: number | null;
};

export function useInvoiceActions() {
  const [labelDownloading, setLabelDownloading] = useState(false);
  const [labelPreviewOpen, setLabelPreviewOpen] = useState(false);
  const [labelPreviewData, setLabelPreviewData] = useState<Partial<LabelData> | undefined>(
    undefined
  );

  const getShipment = async (awb: string): Promise<ShipmentLookupRow | null> => {
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
    return data as ShipmentLookupRow | null;
  };

  const asRecord = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  };

  const getString = (value: unknown) => (typeof value === 'string' ? value : undefined);

  const getNumber = (value: unknown) => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }

    return undefined;
  };

  const getPartyDetails = (value: unknown): PartyDetails => {
    const record = asRecord(value);
    return {
      name: getString(record?.name),
      phone: getString(record?.phone),
      address: getString(record?.address),
      city: getString(record?.city),
      state: getString(record?.state),
    };
  };

  const getInvoiceSupplementalData = (inv: Invoice) => {
    const invoiceRecord = asRecord(inv) ?? {};
    const lineItems =
      asRecord(invoiceRecord.line_items) ?? asRecord(invoiceRecord.financials) ?? {};

    return {
      lineItems,
      consignor: getPartyDetails(lineItems.consignor ?? invoiceRecord.consignor),
      consignee: getPartyDetails(lineItems.consignee ?? invoiceRecord.consignee),
    };
  };

  const formatAddress = (address: unknown) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (typeof address !== 'object' || Array.isArray(address)) return '';
    const { line1, line2, city, state, zip } = address as Record<string, string | undefined>;
    return [line1, line2, city, state, zip].filter(Boolean).join(', ');
  };

  const formatInvoiceDateTag = (dateInput?: string) => {
    const date = dateInput ? new Date(dateInput) : new Date();
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
    return safeDate.toISOString().slice(0, 10).replace(/-/g, '');
  };

  const buildInvoiceFilename = (
    inv: Invoice,
    consignor?: PartyNameLike,
    consignee?: PartyNameLike
  ) => {
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

  const resolveHubLocation = (
    row: ShipmentLookupRow,
    type: 'origin' | 'destination'
  ): HubLocation => {
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

  const mapShipmentForLabel = (row: ShipmentLookupRow): Shipment => {
    const originHub = resolveHubLocation(row, 'origin');
    const destinationHub = resolveHubLocation(row, 'destination');
    const weight = Number(row.total_weight ?? 0);

    return {
      id: row.id,
      awb: row.cn_number || row.awb || '',
      customerId: row.customer_id || '',
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
    logger.debug('[Label]', 'Building shipment from invoice', { id: inv.id, awb: inv.awb });
    const { lineItems, consignor, consignee } = getInvoiceSupplementalData(inv);

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
      const { consignor: fallbackConsignor, consignee: fallbackConsignee } =
        getInvoiceSupplementalData(inv);

      const consignor = shipmentRow
        ? {
            name: shipmentRow.consignor_name,
            phone: shipmentRow.consignor_phone,
            address: formatAddress(shipmentRow.consignor_address),
          }
        : fallbackConsignor;
      const consignee = shipmentRow
        ? {
            name: shipmentRow.consignee_name,
            phone: shipmentRow.consignee_phone,
            address: formatAddress(shipmentRow.consignee_address),
          }
        : fallbackConsignee;

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
    const { consignee } = getInvoiceSupplementalData(inv);

    const phone = consignee.phone || shipment?.consignee_phone || '';
    if (!phone) {
      toast.error('No customer phone number found for this invoice.');
      return;
    }
    const trackingUrl = `${window.location.origin}/track/${inv.awb}`;
    const text = `Hello, here is your invoice ${inv.invoiceNumber} for shipment CN ${inv.awb}.
Amount: ${formatCurrency(inv.financials.totalAmount)}
Status: ${inv.status}
Track your shipment here: ${trackingUrl}
Thank you for choosing TAC Cargo.`;
    const url = `https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = async (inv: Invoice) => {
    const shipment = inv.awb ? await getShipment(inv.awb) : null;
    const email = shipment?.customer?.email || '';
    if (!email) {
      toast.error('No customer email found for this invoice.');
      return;
    }
    const subject = `Invoice ${inv.invoiceNumber} - TAC Cargo`;
    const body = `Dear Customer,\n\nPlease find details for invoice ${inv.invoiceNumber} related to shipment ${inv.awb}.\n\nAmount: ${formatCurrency(inv.financials.totalAmount)}\nTrack: ${window.location.origin}/track/${inv.awb}\n\nThank you,\nTAC Cargo Team`;
    window.open(
      `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      '_blank'
    );
  };

  // Helper to build Invoice object from DB row
  const buildInvoiceFromRow = (row: InvoiceRowLike): Invoice => {
    const lineItems = asRecord(row.line_items) ?? {};
    const awb = row.shipment?.cn_number || getString(lineItems.awb) || '';
    const taxRecord = asRecord(lineItems.tax);
    const tax = {
      cgst: getNumber(taxRecord?.cgst) ?? 0,
      sgst: getNumber(taxRecord?.sgst) ?? 0,
      igst: getNumber(taxRecord?.igst) ?? 0,
      total: getNumber(taxRecord?.total) ?? row.tax_amount ?? 0,
    };

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
      paymentMode: (getString(lineItems.paymentMode) as PaymentMode | undefined) || 'PAID',
      financials: {
        ratePerKg: getNumber(lineItems.ratePerKg) ?? 0,
        baseFreight: getNumber(lineItems.baseFreight) ?? row.subtotal ?? 0,
        docketCharge: getNumber(lineItems.docketCharge) ?? 0,
        pickupCharge: getNumber(lineItems.pickupCharge) ?? 0,
        packingCharge: getNumber(lineItems.packingCharge) ?? 0,
        fuelSurcharge: getNumber(lineItems.fuelSurcharge) ?? 0,
        handlingFee: getNumber(lineItems.handlingFee) ?? 0,
        insurance: getNumber(lineItems.insurance) ?? 0,
        tax,
        discount: getNumber(lineItems.discount) ?? row.discount ?? 0,
        totalAmount: row.total ?? 0,
        advancePaid: getNumber(lineItems.advancePaid) ?? 0,
        balance: getNumber(lineItems.balance) ?? row.total ?? 0,
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
