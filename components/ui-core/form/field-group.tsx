import React from 'react';
import { cn } from '@/lib/utils';

interface FieldGroupProps {
  /** The label text shown above the control */
  label: string;
  /** Matches the `id` on the control inside — enables accessible htmlFor */
  htmlFor?: string;
  /** Appends a red asterisk to the label */
  required?: boolean;
  /** Small hint text shown below the control */
  hint?: string;
  /** Error message — if set, hint is suppressed and text turns destructive */
  error?: string;
  /** Optional action/button to show next to the label */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * FieldGroup — wraps a label + control + hint/error in a consistent vertical
 * stack used across all manual (non-RHF) forms in this project.
 *
 * For React Hook Form forms, use ShadCN's FormField > FormItem > FormLabel +
 * FormControl + FormMessage pattern instead.
 */
export function FieldGroup({
  label,
  htmlFor,
  required,
  hint,
  error,
  action,
  children,
  className,
}: FieldGroupProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex justify-between items-center">
        <label
          htmlFor={htmlFor}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground select-none"
        >
          {label}
          {required && (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {action}
      </div>

      {children}

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
