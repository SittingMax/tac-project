'use client';

import { useState, useEffect } from 'react';
import { FormProvider as Form } from 'react-hook-form';
import { toast } from 'sonner';
import { motion, AnimatePresence, MotionConfig } from '@/lib/motion';
import useMeasure from 'react-use-measure';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, Loader2, Printer } from 'lucide-react';

import { useCreateInvoice, useUpdateInvoice, InvoiceWithRelations } from '@/hooks/useInvoices';
import { useCreateShipment } from '@/hooks/useShipments';
import { useCustomers, Customer as CustomerDB } from '@/hooks/useCustomers';
import { useInvoiceActions } from '@/hooks/useInvoiceActions';
import { Invoice, Shipment } from '@/types';
import { LabelPreviewDialog } from '@/components/domain/LabelPreviewDialog';
import { generateLabelFromFormData } from '@/lib/utils/label-utils';
import { HUBS } from '@/lib/constants';
import { normalizeCustomerAddress } from '@/lib/utils/address-utils';

import { useMultiStepInvoice, steps, InvoiceFormData } from '@/hooks/useMultiStepInvoice';
import { BasicsStep } from './invoice-steps/BasicsStep';
import { PartiesStep } from './invoice-steps/PartiesStep';
import { CargoStep } from './invoice-steps/CargoStep';
import { PaymentStep } from './invoice-steps/PaymentStep';

// Helper to resolve city to Hub ID
const resolveHubId = (city: string): string => {
  if (!city) return HUBS.NEW_DELHI.uuid;
  const c = city.toLowerCase();

  if (c.includes('imphal') || c.includes('manipur')) {
    return HUBS.IMPHAL.uuid;
  }
  return HUBS.NEW_DELHI.uuid;
};

interface Props {
  onSuccess: (invoice?: Invoice, shipment?: Shipment) => void;
  onCancel: () => void;
  initialData?: InvoiceWithRelations;
}

export default function MultiStepCreateInvoice({ onSuccess, onCancel, initialData }: Props) {
  const invoiceState = useMultiStepInvoice(initialData);
  const {
    form, currentStep, setCurrentStep, direction, setDirection,
    mode, setMode,
    selectedShipment, setSelectedShipment,
    subtotal, tax, total, balance, computeGstSplit,
    nextStep, prevStep
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
  const [measureRef, bounds] = useMeasure();

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

        const newShipment = await createShipmentMutation.mutateAsync({
          customer_id: data.customerId,
          origin_hub_id: originHubId,
          destination_hub_id: destHubId,
          mode: data.transportMode as 'AIR' | 'TRUCK',
          service_level:
            data.transportMode === 'AIR' ? 'EXPRESS' as const : 'STANDARD' as const,
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

      const invoicePayload: Record<string, unknown> = {
        invoice_number: data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        customer_id: data.customerId,
        shipment_id: finalShipmentId || null,
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
          }
        }
      };

      let resultInvoice;
      if (initialData?.id) {
        resultInvoice = await updateInvoiceMutation.mutateAsync({
          id: initialData.id,
          ...invoicePayload,
        } as any);
        toast.success('Invoice updated successfully!');
      } else {
        resultInvoice = await createInvoiceMutation.mutateAsync(invoicePayload as any);
        localStorage.removeItem('invoice_draft');
        toast.success('Invoice created securely!');
      }

      const invoiceForDialog = buildInvoiceFromRow(resultInvoice);

      onSuccess(invoiceForDialog, (selectedShipment as Shipment) || undefined);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to create invoice.');
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
    form.setValue(`${prefix}Name` as keyof InvoiceFormData, customer.companyName || customer.name, {
      shouldValidate: true,
    });
    form.setValue(`${prefix}Phone` as keyof InvoiceFormData, customer.phone, { shouldValidate: true });

    if (customer.address) {
      const normalized = normalizeCustomerAddress(customer.address);
      if (normalized.line1)
        form.setValue(
          `${prefix}Address` as keyof InvoiceFormData,
          `${normalized.line1}${normalized.line2 ? ', ' + normalized.line2 : ''}`,
          { shouldValidate: true }
        );
      if (normalized.city)
        form.setValue(`${prefix}City` as keyof InvoiceFormData, normalized.city, { shouldValidate: true });
      if (normalized.state)
        form.setValue(`${prefix}State` as keyof InvoiceFormData, normalized.state, { shouldValidate: true });
      if (normalized.zip)
        form.setValue(`${prefix}Zip` as keyof InvoiceFormData, normalized.zip, { shouldValidate: true });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicsStep form={form} mode={mode} setMode={setMode} setSelectedShipment={setSelectedShipment} />;
      case 1:
        return <PartiesStep form={form} customers={customers} fillCustomerData={fillCustomerData} />;
      case 2:
        return <CargoStep form={form} setShowLabelPreview={setShowLabelPreview} />;
      case 3:
        return <PaymentStep form={form} subtotal={subtotal} tax={tax} total={total} balance={balance} />;
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
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full min-h-[70vh]">
          {/* Progress Header */}
          <div className="mb-6">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {steps[currentStep].title}
                </h2>
                <p className="text-muted-foreground text-sm">{steps[currentStep].description}</p>
              </div>
              <div className="text-xs font-semibold tracking-wide uppercase text-muted-foreground border border-border/60 bg-muted/40 px-3 py-1 rounded-none">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <div className="h-2 w-full bg-muted rounded-none overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                const stateClasses = isActive
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : isComplete
                    ? 'border-border bg-muted text-foreground'
                    : 'border-border/40 bg-muted/40 text-muted-foreground';
                const badgeClasses = isActive
                  ? 'bg-primary text-primary-foreground'
                  : isComplete
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground';
                return (
                  <div
                    key={step.title}
                    className={`flex items-center gap-2 rounded-none border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${stateClasses}`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-none text-[10px] font-bold ${badgeClasses}`}
                    >
                      {index + 1}
                    </span>
                    <span>{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content Card */}
          <Card className="flex-1 overflow-hidden flex flex-col border-border/60 shadow-lg">
            <motion.div
              animate={{ height: bounds.height > 0 ? bounds.height : 'auto' }}
              className="relative overflow-hidden"
              transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            >
              <div ref={measureRef}>
                <CardContent className="p-8">
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
                </CardContent>
              </div>
            </motion.div>

            <CardFooter className="flex justify-between border-t bg-muted/20 p-6 z-10 mt-auto">
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
                    <Printer className="w-4 h-4 mr-2" />
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
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : currentStep === steps.length - 1 ? (
                    <>
                      Confirm & Book <Check className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </MotionConfig>

      {/* Label Preview Dialog */}
      <LabelPreviewDialog
        open={showLabelPreview}
        onOpenChange={setShowLabelPreview}
        shipmentData={showLabelPreview ? generateLabelFromFormData(form.getValues() as InvoiceFormData) : undefined}
      />
    </Form>
  );
}
