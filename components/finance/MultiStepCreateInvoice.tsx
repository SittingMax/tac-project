'use client';

import { useState, useEffect } from 'react';
import { FormProvider as Form } from 'react-hook-form';
import { toast } from 'sonner';
import { motion, AnimatePresence, MotionConfig } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, Loader2, Printer } from 'lucide-react';

import {
  useCreateInvoice,
  useUpdateInvoice,
  InvoiceWithRelations,
  CreateInvoiceInput,
  UpdateInvoiceInput,
} from '@/hooks/useInvoices';
import { useCreateShipment } from '@/hooks/useShipments';
import { useCustomers, Customer as CustomerDB } from '@/hooks/useCustomers';
import { useInvoiceActions } from '@/hooks/useInvoiceActions';
import { Invoice, Shipment } from '@/types';
import { LabelPreviewDialog } from '@/components/domain/LabelPreviewDialog';
import { generateLabelFromFormData } from '@/lib/utils/label-utils';
import { HUBS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { normalizeCustomerAddress } from '@/lib/utils/address-utils';
import { cn } from '@/lib/utils';

import { useMultiStepInvoice, steps, InvoiceFormData } from '@/hooks/useMultiStepInvoice';
import { BasicsStep } from './invoice-steps/BasicsStep';
import { PartiesStep } from './invoice-steps/PartiesStep';
import { CargoStep } from './invoice-steps/CargoStep';
import { PaymentStep } from './invoice-steps/PaymentStep';

const resolveHubId = (city: string): string | null => {
  if (!city) return null;
  const c = city.toLowerCase();

  if (c.includes('imphal') || c.includes('manipur')) {
    return HUBS.IMPHAL.uuid;
  }
  if (c.includes('delhi')) {
    return HUBS.NEW_DELHI.uuid;
  }
  return null;
};

interface Props {
  onSuccess: (invoice?: Invoice, shipment?: Shipment) => void;
  onCancel: () => void;
  initialData?: InvoiceWithRelations;
}

export default function MultiStepCreateInvoice({ onSuccess, onCancel, initialData }: Props) {
  const invoiceState = useMultiStepInvoice(initialData);
  const {
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
  } = invoiceState;
  const { buildInvoiceFromRow } = useInvoiceActions();

  const createInvoiceMutation = useCreateInvoice();
  const createShipmentMutation = useCreateShipment();
  const updateInvoiceMutation = useUpdateInvoice();
  const isLoading =
    createInvoiceMutation.isPending ||
    updateInvoiceMutation.isPending ||
    createShipmentMutation.isPending;

  const { data: customers = [] } = useCustomers();
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  // Form auto-save (draft)
  useEffect(() => {
    const timer = setInterval(() => {
      const draft = JSON.stringify(form.getValues());
      localStorage.setItem('invoice_draft', draft);
    }, 5000);
    return () => clearInterval(timer);
  }, [form]);

  // Handle initialization manually if needed (omitted for brevity, handled generally well by defaultValues)

  const handleNextSubmit = async (data: InvoiceFormData): Promise<void> => {
    try {
      let finalShipmentId = (selectedShipment as Shipment | null)?.id;

      // Auto-create shipment if NEW_BOOKING mode
      if (mode === 'NEW_BOOKING' && !finalShipmentId) {
        // Validate customer selection — DB requires a valid UUID
        if (!data.customerId) {
          toast.error('Please select a customer from the Consignor or Consignee search.');
          // Navigate back to Parties step so user can fix
          setDirection(-1);
          setCurrentStep(1);
          return;
        }

        const originHubId = resolveHubId(data.consignorCity);
        const destHubId = resolveHubId(data.consigneeCity);

        if (!originHubId || !destHubId) {
          toast.error(
            'Auto-created shipments currently support only Imphal and New Delhi hub cities. Choose supported cities or link an existing shipment.'
          );
          setDirection(-1);
          setCurrentStep(1);
          return;
        }

        if (originHubId === destHubId) {
          toast.error(
            'Consignor and consignee cannot resolve to the same hub for auto-created shipments. Choose different supported hub cities or link an existing shipment.'
          );
          setDirection(-1);
          setCurrentStep(1);
          return;
        }

        const newShipment = await createShipmentMutation.mutateAsync({
          customer_id: data.customerId,
          origin_hub_id: originHubId,
          destination_hub_id: destHubId,
          mode: data.transportMode as 'AIR' | 'TRUCK',
          service_level:
            data.transportMode === 'AIR' ? ('EXPRESS' as const) : ('STANDARD' as const),
          package_count: data.pieces,
          total_weight: data.chargedWeight,
          consignee_name: data.consigneeName,
          consignee_phone: data.consigneePhone,
          consignee_address: {
            line1: data.consigneeAddress,
            city: data.consigneeCity,
            state: data.consigneeState,
            zip: data.consigneeZip,
          },
          consignor_name: data.consignorName,
          consignor_phone: data.consignorPhone,
          consignor_address: {
            line1: data.consignorAddress,
            city: data.consignorCity,
            state: data.consignorState,
            zip: data.consignorZip,
          },
        });

        if (!newShipment) throw new Error('Failed to auto-create shipment relation');
        finalShipmentId = newShipment.id;

        setSelectedShipment({
          id: newShipment.id,
          awb: newShipment.cn_number,
          mode: newShipment.mode,
          status: newShipment.status,
        });
        // Write the server-generated CN back into the form so label-utils reads it
        form.setValue('awb', newShipment.cn_number);
        toast.success(`Shipment auto-created for awb: ${newShipment.cn_number}`);
      }

      const financials = {
        baseFreight: data.baseFreight || 0,
        docketCharge: data.docketCharge || 0,
        pickupCharge: data.pickupCharge || 0,
        packingCharge: data.packingCharge || 0,
        fuelSurcharge: data.fuelSurcharge || 0,
        handlingFee: data.handlingFee || 0,
        insurance: data.insurance || 0,
        discount: data.discount || 0,
        advancePaid: data.advancePaid || 0,
        subtotal,
        tax,
        total,
        balance,
      };

      const fullTax = computeGstSplit(tax as number, data.consignorState, data.consigneeState);

      const invoicePayload: Omit<UpdateInvoiceInput, 'id'> & CreateInvoiceInput = {
        customer_id: data.customerId!,
        shipment_id: finalShipmentId || undefined,
        subtotal: financials.subtotal,
        tax_amount: tax as number,
        total: financials.total,
        discount: data.discount || 0,
        issue_date: data.bookingDate,
        line_items: {
          status: balance > 0 ? 'DIL_DUE' : 'DIL_PAID',
          paymentMode: data.paymentMode,
          advancePaid: financials.advancePaid,
          balance: financials.balance,
          ratePerKg: data.ratePerKg,
          gstRate: data.gstApplicable ? data.gstRate : 0,
          baseFreight: financials.baseFreight,
          docketCharge: financials.docketCharge,
          pickupCharge: financials.pickupCharge,
          packingCharge: financials.packingCharge,
          fuelSurcharge: financials.fuelSurcharge,
          handlingFee: financials.handlingFee,
          insurance: financials.insurance,
          tax: fullTax,
          consignor: {
            name: data.consignorName,
            phone: data.consignorPhone,
            address: data.consignorAddress,
            city: data.consignorCity,
            state: data.consignorState,
            zip: data.consignorZip,
            gstin: data.consignorGstin,
          },
          consignee: {
            name: data.consigneeName,
            phone: data.consigneePhone,
            address: data.consigneeAddress,
            city: data.consigneeCity,
            state: data.consigneeState,
            zip: data.consigneeZip,
            gstin: data.consigneeGstin,
          },
          cargo: {
            pieces: data.pieces,
            actualWeight: data.actualWeight,
            chargedWeight: data.chargedWeight,
            contents: data.contents,
            declaredValue: data.declaredValue,
            dimL: data.dimL,
            dimB: data.dimB,
            dimH: data.dimH,
          },
        },
      };

      let resultInvoice;
      if (initialData?.id) {
        resultInvoice = await updateInvoiceMutation.mutateAsync({
          id: initialData.id,
          ...invoicePayload,
        });
        toast.success('Invoice updated successfully!');
      } else {
        resultInvoice = await createInvoiceMutation.mutateAsync({
          ...invoicePayload,
          // Since CreateInvoiceInput doesn't need invoice_number directly inside the hook (it generates it inside), we can just cast it or safely pass
          // However, invoice_number is generated in useCreateInvoice, and it doesn't take invoice_number into CreateInvoiceInput. Let's make sure it's shaped correctly:
        } as CreateInvoiceInput);
        localStorage.removeItem('invoice_draft');
        toast.success('Invoice created successfully!');
      }

      const invoiceForDialog = buildInvoiceFromRow(resultInvoice);

      onSuccess(invoiceForDialog, (selectedShipment as Shipment) || undefined);
    } catch (error) {
      logger.error('MultiStepCreateInvoice', 'Submission error', { error });
      toast.error(initialData?.id ? 'Failed to update invoice.' : 'Failed to create invoice.');
      throw error;
    }
  };

  const handleNextClick = () => {
    nextStep(handleNextSubmit);
  };

  const fillCustomerData = (customer: CustomerDB, type: 'CONSIGNOR' | 'CONSIGNEE') => {
    // Capture the customer ID for shipment creation
    form.setValue('customerId', customer.id, { shouldValidate: true });

    const prefix = type === 'CONSIGNOR' ? 'consignor' : 'consignee';
    form.setValue(`${prefix}Name` as keyof InvoiceFormData, customer.name, {
      shouldValidate: true,
    });
    form.setValue(`${prefix}Phone` as keyof InvoiceFormData, customer.phone, {
      shouldValidate: true,
    });

    if (customer.address) {
      const normalized = normalizeCustomerAddress(customer.address);
      if (normalized.line1)
        form.setValue(
          `${prefix}Address` as keyof InvoiceFormData,
          `${normalized.line1}${normalized.line2 ? ', ' + normalized.line2 : ''}`,
          { shouldValidate: true }
        );
      if (normalized.city)
        form.setValue(`${prefix}City` as keyof InvoiceFormData, normalized.city, {
          shouldValidate: true,
        });
      if (normalized.state)
        form.setValue(`${prefix}State` as keyof InvoiceFormData, normalized.state, {
          shouldValidate: true,
        });
      if (normalized.zip)
        form.setValue(`${prefix}Zip` as keyof InvoiceFormData, normalized.zip, {
          shouldValidate: true,
        });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicsStep
            form={form}
            mode={mode}
            setMode={setMode}
            setSelectedShipment={setSelectedShipment}
          />
        );
      case 1:
        return (
          <PartiesStep form={form} customers={customers} fillCustomerData={fillCustomerData} />
        );
      case 2:
        return <CargoStep form={form} setShowLabelPreview={setShowLabelPreview} />;
      case 3:
        return (
          <PaymentStep form={form} subtotal={subtotal} tax={tax} total={total} balance={balance} />
        );
      default:
        return null;
    }
  };

  const variants = {
    initial: (direction: number) => ({ x: `${110 * direction}%`, opacity: 0 }),
    animate: { x: '0%', opacity: 1 },
    exit: (direction: number) => ({ x: `${-110 * direction}%`, opacity: 0 }),
  };

  return (
    <Form {...form}>
      <MotionConfig transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}>
        <div className="flex flex-col h-full w-full min-h-0 bg-background">
          {/* Vanguard Minimalist Progress Header */}
          <div className="shrink-0 mb-0 px-10 pt-8 bg-background">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  {steps[currentStep].title}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {steps[currentStep].description}
                </p>
              </div>
              <div className="text-[10px] font-mono font-semibold tracking-widest uppercase text-muted-foreground">
                Step {currentStep + 1} // {steps.length}
              </div>
            </div>

            <nav aria-label="Progress" className="w-full pb-6 border-b border-border/40">
              <ol className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {steps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isComplete = index < currentStep;
                  const isUpcoming = index > currentStep;

                  return (
                    <li key={step.title} className="flex items-center shrink-0">
                      <div
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-none transition duration-300',
                          isActive &&
                            'bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary/20',
                          isComplete && 'text-muted-foreground',
                          isUpcoming && 'text-muted-foreground/40'
                        )}
                      >
                        <span className="font-mono text-[10px] tracking-widest uppercase">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm tracking-tight">{step.title}</span>
                      </div>
                      {index !== steps.length - 1 && (
                        <div className="mx-2 h-[1px] w-6 shrink-0 bg-border/40" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          {/* Step Content Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-background/50">
            <div className="flex-1 overflow-y-auto px-10 py-8">
              <div className="w-full">
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <motion.div
                    key={currentStep}
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    custom={direction}
                    className="w-full"
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 flex justify-between border-t border-border/40 bg-muted/30 px-10 py-6 z-10 transition-colors">
              <Button
                variant="outline"
                type="button"
                onClick={currentStep === 0 ? onCancel : prevStep}
                disabled={isLoading}
              >
                {currentStep === 0 ? 'Cancel' : 'Back'}
              </Button>

              <div className="flex gap-2">
                {currentStep === steps.length - 1 && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowLabelPreview(true)}
                    disabled={isLoading}
                  >
                    <Printer size={16} strokeWidth={1.5} className="mr-2" />
                    Preview Label
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleNextClick}
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <Loader2 size={16} strokeWidth={1.5} className="animate-spin mr-2" />
                  ) : currentStep === steps.length - 1 ? (
                    <>
                      Confirm & Book <Check size={16} strokeWidth={1.5} className="ml-2" />
                    </>
                  ) : (
                    <>
                      Continue <ChevronRight size={16} strokeWidth={1.5} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MotionConfig>

      {/* Label Preview Dialog */}
      <LabelPreviewDialog
        open={showLabelPreview}
        onOpenChange={setShowLabelPreview}
        shipmentData={
          showLabelPreview
            ? generateLabelFromFormData(form.getValues() as InvoiceFormData)
            : undefined
        }
      />
    </Form>
  );
}
