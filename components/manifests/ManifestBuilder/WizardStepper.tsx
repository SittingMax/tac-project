'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  name: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-none text-sm font-medium transition-colors',
                  step.id < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary border border-border text-muted-foreground'
                )}
              >
                {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
              </span>
              <span
                className={cn(
                  'text-sm font-medium transition-colors hidden sm:block',
                  step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.name}
              </span>
            </div>
            {stepIdx !== steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    'h-0.5 w-full transition-colors',
                    step.id < currentStep ? 'bg-primary' : 'bg-border'
                  )}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
