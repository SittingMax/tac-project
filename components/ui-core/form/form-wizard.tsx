import React, { useState } from 'react';
import { Stepper, Step } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';

export interface FormWizardStep {
  title: string;
  description?: string;
  content: React.ReactNode;
  isValid?: boolean;
}

export interface FormWizardProps {
  steps: FormWizardStep[];
  onComplete?: () => void | Promise<void>;
  className?: string;
  isSubmitting?: boolean;
}

export function FormWizard({ steps, onComplete, className, isSubmitting }: FormWizardProps) {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const activeStepConfig = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;

  return (
    <div className={cn('flex flex-col flex flex-col gap-8', className)}>
      <Stepper activeStep={activeStep}>
        {steps.map((step, idx) => (
          <Step key={idx} title={step.title} description={step.description} />
        ))}
      </Stepper>

      <div className="flex-1 p-6 border border-border/50 bg-card rounded-none shadow-sm min-h-[300px]">
        {activeStepConfig.content}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={handleBack} disabled={activeStep === 0 || isSubmitting}>
          <ChevronLeft size={16} strokeWidth={1.5} className="mr-2" />
          Back
        </Button>
        <Button
          onClick={isLastStep ? onComplete : handleNext}
          disabled={
            (!activeStepConfig.isValid && activeStepConfig.isValid !== undefined) || isSubmitting
          }
        >
          {isLastStep ? (
            <>
              {isSubmitting ? 'Saving...' : 'Submit'}
              {!isSubmitting && <Save size={16} strokeWidth={1.5} className="ml-2" />}
            </>
          ) : (
            <>
              Next
              <ChevronRight size={16} strokeWidth={1.5} className="ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
