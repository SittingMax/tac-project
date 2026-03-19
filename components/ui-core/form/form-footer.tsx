import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFooterProps {
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  cancelLabel?: string;
}

export function FormFooter({
  onCancel,
  submitLabel = 'Save',
  isLoading = false,
  disabled = false,
  className,
  cancelLabel = 'Cancel',
}: FormFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 pt-4 border-t border-border mt-6',
        className
      )}
    >
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" disabled={isLoading || disabled} className="min-w-[100px]">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}
