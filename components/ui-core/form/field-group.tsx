import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface FieldGroupProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A simple form field wrapper that renders a label above the child control,
 * with optional hint and inline error text below.
 */
function FieldGroup({ label, htmlFor, hint, error, className, children }: FieldGroupProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label
          htmlFor={htmlFor}
          className={cn('text-sm font-medium leading-none', error && 'text-destructive')}
        >
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
      {error && (
        <p className="text-xs text-destructive leading-relaxed" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { FieldGroup };
export type { FieldGroupProps };
