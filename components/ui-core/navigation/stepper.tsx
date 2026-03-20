import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  name: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full pb-4 mb-4 border-b border-border', className)}>
      <ol className="flex items-center gap-1.5 overflow-x-auto">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.name} className="flex items-center shrink-0">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm transition-colors rounded-md',
                  isCurrent && 'bg-primary/10 text-primary font-semibold',
                  isCompleted && 'text-muted-foreground',
                  !isCurrent && !isCompleted && 'text-muted-foreground/40'
                )}
              >
                {isCompleted ? (
                  <Check className="size-3.5 shrink-0" />
                ) : (
                  <span className="font-mono text-[10px] tracking-widest uppercase">
                    {String(step.id).padStart(2, '0')}
                  </span>
                )}
                <span className="tracking-tight">{step.name}</span>
              </div>
              {idx !== steps.length - 1 && <div className="mx-2 h-px w-5 shrink-0 bg-border/40" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
