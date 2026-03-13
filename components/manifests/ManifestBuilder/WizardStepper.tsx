'use client';

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
    <nav aria-label="Progress" className="w-full pb-4 mb-4 border-b border-border/40">
      <ol className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {steps.map((step, stepIdx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <li key={step.name} className="flex items-center shrink-0">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-300',
                  isCurrent && 'bg-primary/10 text-primary font-semibold',
                  isCompleted && 'text-muted-foreground',
                  isUpcoming && 'text-muted-foreground/40 opacity-70'
                )}
              >
                <span className="font-mono text-[10px] tracking-widest uppercase">
                  {String(step.id).padStart(2, '0')}
                </span>
                <span className="text-sm tracking-tight">{step.name}</span>
              </div>
              {stepIdx !== steps.length - 1 && (
                <div className="mx-2 h-[1px] w-6 shrink-0 bg-border/40" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
