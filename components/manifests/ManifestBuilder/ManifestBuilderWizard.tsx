import * as React from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Lock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useScanContext } from '@/context/ScanContext';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useManifestBuilder } from '@/hooks/useManifestBuilder';
import { useStaff } from '@/hooks/useStaff';
import { WizardStepper } from './WizardStepper';
import { StepManifestSetup, type ManifestSettingsValues } from './steps/StepManifestSetup';
import { StepAddShipments } from './steps/StepAddShipments';
import { StepReviewFinalize } from './steps/StepReviewFinalize';
import type { CreateManifestParams, ManifestStatus } from '@/lib/services/manifestService';

interface ManifestBuilderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (manifestId: string) => void;
  initialManifestId?: string | null;
}

const WIZARD_STEPS = [
  { id: 1, name: 'Manifest Setup' },
  { id: 2, name: 'Add Shipments' },
  { id: 3, name: 'Review & Finalize' },
];

// Delay to allow React batched updates and portal unmounting to complete
// before closing the main dialog. Should stay in sync with dialog/portal
// exit animation durations.
const PORTAL_CLEANUP_DELAY_MS = 150;

function combineDateTimeWithPeriod(
  date: Date,
  hour?: string,
  minute?: string,
  period?: 'AM' | 'PM'
): string {
  const clone = new Date(date);

  let h = parseInt(hour || '0', 10);
  const m = parseInt(minute || '0', 10);

  if (period) {
    // 12-hour to 24-hour conversion
    // 12:xx AM -> 00:xx, 12:xx PM -> 12:xx
    if (h === 12) h = 0;
    if (period === 'PM') h += 12;
  }

  clone.setHours(h, m, 0, 0);
  return clone.toISOString();
}

import { useHubs } from '@/hooks/useHubs';

export function ManifestBuilderWizard({
  open,
  onOpenChange,
  onComplete,
  initialManifestId,
}: ManifestBuilderWizardProps) {
  const navigate = useNavigate();
  const { setActiveContext } = useScanContext();
  const isMountedRef = React.useRef(true);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isStep1Valid, setIsStep1Valid] = React.useState(false);
  const [createdManifestId, setCreatedManifestId] = React.useState<string | null>(null);

  // Track mounted state to prevent updates after unmount
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Register as active scan context when modal is open
  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line no-console
      console.debug('[ManifestBuilder] Registering as active scan context');
      setActiveContext('MANIFEST_BUILDER');
    } else {
      // eslint-disable-next-line no-console
      console.debug('[ManifestBuilder] Releasing scan context');
      setActiveContext('GLOBAL');
    }

    return () => {
      // Cleanup: Always restore global context on unmount
      setActiveContext('GLOBAL');
    };
  }, [open, setActiveContext]);

  // Utility to close any open Select/Popover portals by blurring active element
  const closeNestedPortals = React.useCallback(() => {
    // Blur any focused element to close Select dropdowns
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Small delay to allow portal animations to complete
    return new Promise<void>((resolve) => setTimeout(resolve, 16));
  }, []);

  // Form Data State
  const [setupData, setSetupData] = React.useState<ManifestSettingsValues>({
    fromHubId: '',
    toHubId: '',
    type: 'AIR',
    onlyReady: true,
    matchDestination: true,
    excludeCod: false,
  });

  const { data: hubs = [] } = useHubs();
  const { data: staffList = [] } = useStaff();
  const currentStaff = staffList.find((s) => s.is_active) || null;

  const builder = useManifestBuilder({
    manifestId: initialManifestId || createdManifestId || undefined,
    validateDestination: setupData.matchDestination,
    validateStatus: setupData.onlyReady,
    onManifestCreated: (manifest) => {
      // Capture the new manifest ID
      setCreatedManifestId(manifest.id);
      // Move to next step after creation
      setCurrentStep(2);
    },
  });

  // Track previous open state for detecting close transition
  const prevOpenRef = React.useRef(open);

  // Reset when opening/closing
  React.useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (open && !wasOpen) {
      // Dialog opening - reset state immediately
      if (initialManifestId) {
        setCurrentStep(2);
        // TODO: Load manifest data into setupData if editing existing
      } else {
        setCurrentStep(1);
        setSetupData({
          fromHubId: '',
          toHubId: '',
          type: 'AIR',
          onlyReady: true,
          matchDestination: true,
          excludeCod: false,
        });
      }
    } else if (!open && wasOpen) {
      // Dialog closing - delay step reset until after portal cleanup
      queueMicrotask(() => {
        setCurrentStep(1);
        setCreatedManifestId(null);
      });
    }
  }, [open, initialManifestId]);

  const handleStep1Submit = async () => {
    // Create manifest if not exists
    if (!builder.manifest) {
      const params: CreateManifestParams = {
        type: setupData.type,
        fromHubId: setupData.fromHubId,
        toHubId: setupData.toHubId,
        status: 'BUILDING' as ManifestStatus,
        createdByStaffId: currentStaff?.id,
        // AIR
        airlineCode: setupData.airlineCode,
        flightNumber: setupData.flightNumber,
        flightDate: setupData.flightDate ? format(setupData.flightDate, 'yyyy-MM-dd') : undefined,
        etd:
          setupData.flightDate && setupData.etdHour
            ? combineDateTimeWithPeriod(
                setupData.flightDate,
                setupData.etdHour,
                setupData.etdMinute,
                setupData.etdPeriod
              )
            : undefined,
        eta:
          setupData.flightDate && setupData.etaHour
            ? combineDateTimeWithPeriod(
                setupData.flightDate,
                setupData.etaHour,
                setupData.etaMinute,
                setupData.etaPeriod
              )
            : undefined,
        // TRUCK
        vehicleNumber: setupData.vehicleNumber,
        driverName: setupData.driverName,
        driverPhone: setupData.driverPhone,
        dispatchAt: setupData.dispatchDate
          ? combineDateTimeWithPeriod(
              setupData.dispatchDate,
              setupData.dispatchHour,
              setupData.dispatchMinute,
              setupData.dispatchPeriod
            )
          : undefined,
        notes: setupData.notes,
      };
      try {
        await builder.createManifest(params);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error occurred';
        toast.error('Failed to create manifest', { description: message });
      }
    } else {
      setCurrentStep(2);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      handleStep1Submit();
    } else if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCloseManifest = async (status: ManifestStatus) => {
    if (!builder.manifest) return;

    setIsSaving(true);
    try {
      await builder.updateStatus(status);
      toast.success('Manifest closed successfully!');
      // Close confirmation dialog first
      setShowCloseConfirm(false);
      setIsSaving(false);
      // Allow React to batch updates and portals to cleanup before closing main dialog
      setTimeout(() => {
        onOpenChange(false);
        onComplete?.(builder.manifest!.id);
      }, PORTAL_CLEANUP_DELAY_MS);
    } catch (error) {
      toast.error('Failed to close manifest');
      console.error('Error closing manifest:', error);
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (builder.items.length > 0 && currentStep > 1) {
      setShowCancelConfirm(true);
    } else {
      // Close any open Select/Popover portals first
      await closeNestedPortals();
      // Reset dialog states
      setShowCloseConfirm(false);
      setShowCancelConfirm(false);
      // Allow portals to cleanup before closing main dialog
      setTimeout(() => {
        onOpenChange(false);
      }, PORTAL_CLEANUP_DELAY_MS);
    }
  };

  const confirmCancel = async () => {
    // Close any open Select/Popover portals first
    await closeNestedPortals();
    // Reset cancel confirmation state
    setShowCancelConfirm(false);
    // Allow AlertDialog portal to cleanup before closing main dialog
    setTimeout(() => {
      onOpenChange(false);
    }, PORTAL_CLEANUP_DELAY_MS);
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="w-[100vw] h-[100dvh] md:w-[min(1200px,92vw)] md:h-[min(88vh,900px)] md:max-h-[90vh] lg:w-[min(1320px,88vw)] md:rounded-none rounded-none flex flex-col gap-0 p-0 max-w-none overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border text-left">
            <DialogTitle className="text-lg">Create Manifest</DialogTitle>
            <DialogDescription className="text-sm">
              Create a new dispatch manifest for cargo shipments
            </DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="px-6 py-4 border-b border-border bg-secondary/20">
            <WizardStepper steps={WIZARD_STEPS} currentStep={currentStep} />
          </div>

          {/* Content - Use CSS visibility instead of conditional rendering to prevent portal destruction */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-background/50">
            <div className="p-4 sm:p-5 md:p-6 lg:p-8">
              {/* Step 1: Manifest Setup - Always mounted, hidden via CSS */}
              <div
                className={currentStep === 1 ? 'block' : 'hidden'}
                aria-hidden={currentStep !== 1}
                inert={currentStep !== 1 ? true : undefined}
              >
                <StepManifestSetup
                  hubs={hubs}
                  data={setupData}
                  onDataChange={setSetupData}
                  isValid={isStep1Valid}
                  onValidationChange={setIsStep1Valid}
                />
              </div>

              {/* Step 2: Add Shipments - Mounted when manifest exists, hidden via CSS */}
              <div
                className={currentStep === 2 ? 'block' : 'hidden'}
                aria-hidden={currentStep !== 2}
                inert={currentStep !== 2 ? true : undefined}
              >
                {builder.manifest && (
                  <StepAddShipments
                    manifestId={builder.manifest.id}
                    staffId={currentStaff?.id}
                    rules={{
                      onlyReady: setupData.onlyReady,
                      matchDestination: setupData.matchDestination,
                      excludeCod: setupData.excludeCod,
                    }}
                    items={builder.items}
                    fromHub={hubs.find((h) => h.id === setupData.fromHubId) ?? null}
                    toHub={hubs.find((h) => h.id === setupData.toHubId) ?? null}
                    isLoading={builder.isLoading}
                    isEditable={builder.isEditable}
                    onItemsChanged={builder.refetch}
                    onRemove={(shipmentId) => builder.removeShipment(shipmentId, currentStaff?.id)}
                    onViewShipment={(shipmentId) => navigate(`/shipments/${shipmentId}`)}
                  />
                )}
              </div>

              {/* Step 3: Review & Finalize - Always mounted, hidden via CSS */}
              <div
                className={currentStep === 3 ? 'block' : 'hidden'}
                aria-hidden={currentStep !== 3}
                inert={currentStep !== 3 ? true : undefined}
              >
                <StepReviewFinalize
                  setupData={setupData}
                  shipments={builder.items.map((i) => i.shipment)}
                  hubs={hubs}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-background">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                {/* Cancel Button */}
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>

                {currentStep > 1 && (
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        {' '}
                        {/* Span needed for disabled button tooltip */}
                        <Button
                          onClick={handleNext}
                          disabled={
                            (currentStep === 1 && (!isStep1Valid || builder.isCreating)) ||
                            (currentStep === 2 && builder.items.length === 0)
                          }
                        >
                          {builder.isCreating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              Next
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {currentStep === 1 && !isStep1Valid && (
                        <p>Please fill all required fields correctly</p>
                      )}
                      {currentStep === 2 && builder.items.length === 0 && (
                        <p>Add at least one shipment to proceed</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleCloseManifest('OPEN')}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save as Open
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowCloseConfirm(true)}
                      disabled={isSaving}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Close Manifest
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog - Only mount when needed to prevent portal race conditions */}
      {showCloseConfirm && (
        <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Manifest?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will close the manifest immediately. Once closed, no more shipments can
                be added and the manifest will be ready for dispatch. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => handleCloseManifest('CLOSED')}
              >
                Close Manifest
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Cancel Confirmation Dialog - Only mount when needed to prevent portal race conditions */}
      {showCancelConfirm && (
        <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to exit? Any shipments added to the
                manifest will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Editing</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmCancel}
              >
                Discard & Exit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </TooltipProvider>
  );
}
