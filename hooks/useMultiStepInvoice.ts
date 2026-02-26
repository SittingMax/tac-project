import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { GSTIN_PATTERN, GSTIN_ERROR_MESSAGE } from '@/lib/constants';

// Validation Schema
const isGstinFieldValid = (val?: string | null) => {
  if (!val) return true;
  const normalized = val.trim().toUpperCase();
  if (!normalized) return true;

  if (normalized.length < 15) return true;
  if (normalized.length === 15) return GSTIN_PATTERN.test(normalized);

  return false;
};

export const invoiceSchema = z.object({
  awb: z.string().optional(),
  invoiceNumber: z.string().optional(),
  customerId: z.string().optional(),
  bookingDate: z.string().min(1, 'Date Required'),
  paymentMode: z.enum(['PAID', 'TO_PAY', 'TBB']),
  transportMode: z.enum(['AIR', 'TRUCK']),

  // Consignor
  consignorName: z.string().min(2, 'Name Required'),
  consignorPhone: z.string().min(10, 'Phone Required'),
  consignorAddress: z.string().min(5, 'Address Required'),
  consignorCity: z.string().min(2, 'City Required'),
  consignorState: z.string().min(2, 'State Required'),
  consignorZip: z.string().min(6, 'Zip Required'),
  consignorGstin: z.string().optional().refine(isGstinFieldValid, GSTIN_ERROR_MESSAGE),

  // Consignee
  consigneeName: z.string().min(2, 'Name Required'),
  consigneePhone: z.string().min(10, 'Phone Required'),
  consigneeAddress: z.string().min(5, 'Address Required'),
  consigneeCity: z.string().min(2, 'City Required'),
  consigneeState: z.string().min(2, 'State Required'),
  consigneeZip: z.string().min(6, 'Zip Required'),
  consigneeGstin: z.string().optional().refine(isGstinFieldValid, GSTIN_ERROR_MESSAGE),

  // Item Details
  contents: z.string().min(2, 'Contents required'),
  declaredValue: z.coerce.number().min(0),
  pieces: z.coerce.number().min(1),

  // Volumetric
  dimL: z.coerce.number().default(0),
  dimB: z.coerce.number().default(0),
  dimH: z.coerce.number().default(0),

  // Weights
  actualWeight: z.coerce.number().min(0.1, 'Required'),
  chargedWeight: z.coerce.number().min(0.1, 'Required'),

  // Financials
  ratePerKg: z.coerce.number().min(0),
  baseFreight: z.coerce.number().min(0),
  docketCharge: z.coerce.number().min(0),
  pickupCharge: z.coerce.number().min(0),
  packingCharge: z.coerce.number().min(0),
  fuelSurcharge: z.coerce.number().min(0),
  handlingFee: z.coerce.number().min(0),
  insurance: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  advancePaid: z.coerce.number().min(0),
  gstApplicable: z.boolean().default(true),
  gstRate: z.coerce.number().min(0).max(100).default(18),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

export const steps = [
  {
    title: 'Basics',
    description: 'CN & Booking Info',
    fields: ['awb', 'bookingDate', 'paymentMode', 'invoiceNumber'],
  },
  {
    title: 'Parties',
    description: 'Consignor & Consignee',
    fields: [
      'customerId',
      'consignorName',
      'consignorPhone',
      'consignorAddress',
      'consignorCity',
      'consignorState',
      'consignorZip',
      'consignorGstin',
      'consigneeName',
      'consigneePhone',
      'consigneeAddress',
      'consigneeCity',
      'consigneeState',
      'consigneeZip',
      'consigneeGstin',
    ],
  },
  {
    title: 'Cargo',
    description: 'Dims, Weight & Content',
    fields: ['contents', 'pieces', 'actualWeight', 'chargedWeight', 'dimL', 'dimB', 'dimH'],
  },
  { title: 'Payment', description: 'Rates & Charges', fields: [] },
];

export function useMultiStepInvoice(_initialData?: unknown) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<number>(0);
  const [mode, setMode] = useState<'NEW_BOOKING' | 'EXISTING_SHIPMENT'>('NEW_BOOKING');
  const [selectedShipment, setSelectedShipment] = useState<unknown | null>(null);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    shouldUnregister: false,
    defaultValues: {
      bookingDate: new Date().toISOString().split('T')[0],
      paymentMode: 'TO_PAY',
      transportMode: 'TRUCK',
      pieces: 1,
      dimL: 0,
      dimB: 0,
      dimH: 0,
      actualWeight: 0,
      chargedWeight: 0,
      ratePerKg: 120,
      docketCharge: 80,
      contents: 'Personal Effects',
      consignorState: 'Delhi',
      consigneeState: 'Manipur',
      consignorCity: 'New Delhi',
      consigneeCity: 'Imphal',
      declaredValue: 0,
      discount: 0,
      advancePaid: 0,
      insurance: 0,
      fuelSurcharge: 0,
      handlingFee: 0,
      packingCharge: 0,
      pickupCharge: 0,
      gstApplicable: true,
      gstRate: 18,
    },
  });

  const { setValue, watch, trigger } = form;
  const formValues = watch();

  const safeNum = useCallback((val: string | number | null | undefined) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // Compute weights & freight
  useEffect(() => {
    const { dimL, dimB, dimH, pieces, actualWeight, ratePerKg } = formValues;
    const volWeight = (safeNum(dimL) * safeNum(dimB) * safeNum(dimH) * safeNum(pieces)) / 5000;
    const chargeable = Math.max(safeNum(actualWeight), parseFloat(volWeight.toFixed(2)));

    if (Math.abs(chargeable - safeNum(formValues.chargedWeight)) > 0.01) {
      setValue('chargedWeight', chargeable);
    }

    if (ratePerKg && chargeable) {
      const freight = Math.round(chargeable * safeNum(ratePerKg));
      if (Math.abs(freight - safeNum(formValues.baseFreight)) > 1) {
        setValue('baseFreight', freight);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formValues.dimL,
    formValues.dimB,
    formValues.dimH,
    formValues.pieces,
    formValues.actualWeight,
    formValues.ratePerKg,
    formValues.chargedWeight,
    formValues.baseFreight,
    setValue,
    safeNum,
  ]);

  const subtotal =
    safeNum(formValues.baseFreight) +
    safeNum(formValues.docketCharge) +
    safeNum(formValues.pickupCharge) +
    safeNum(formValues.packingCharge) +
    safeNum(formValues.fuelSurcharge) +
    safeNum(formValues.handlingFee) +
    safeNum(formValues.insurance) -
    safeNum(formValues.discount);

  const tax = formValues.gstApplicable
    ? Math.round(subtotal * (safeNum(formValues.gstRate) / 100))
    : 0;
  const total = subtotal + tax;
  const balance = total - safeNum(formValues.advancePaid);

  const computeGstSplit = (taxAmount: number, consignorState: string, consigneeState: string) => {
    const originState = (consignorState || '').trim().toUpperCase();
    const destState = (consigneeState || '').trim().toUpperCase();
    if (originState && destState && originState === destState) {
      const half = Math.round(taxAmount / 2);
      return { cgst: half, sgst: taxAmount - half, igst: 0, total: taxAmount };
    }
    return { cgst: 0, sgst: 0, igst: taxAmount, total: taxAmount };
  };

  const nextStep = async (onSubmit: (data: InvoiceFormData) => Promise<void>) => {
    const fieldsToValidate = steps[currentStep].fields;
    const valid = await trigger(fieldsToValidate as (keyof InvoiceFormData)[]);
    if (valid) {
      // Guard: require customerId at Parties step exit (step 1) for NEW_BOOKING mode
      if (currentStep === 1 && mode === 'NEW_BOOKING') {
        const customerId = form.getValues('customerId');
        if (!customerId) {
          toast.error('Please select a customer from the Consignor or Consignee search.');
          return;
        }
      }

      if (currentStep < steps.length - 1) {
        setDirection(1);
        setCurrentStep((prev) => prev + 1);
      } else {
        form.handleSubmit(onSubmit, (errors) => {
          console.error('Form validation failed:', errors);
          toast.error('Please check for errors in the form');
        })();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  return {
    form,
    currentStep,
    setCurrentStep,
    direction,
    setDirection,
    mode,
    setMode,
    selectedShipment,
    setSelectedShipment,
    subtotal,
    tax,
    total,
    balance,
    computeGstSplit,
    nextStep,
    prevStep,
    safeNum,
  };
}
