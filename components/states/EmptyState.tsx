import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center border border-border/40 bg-muted/5">
      <div className="mx-auto max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {actionLabel && onAction && (
          <div className="pt-4">
            <Button variant="default" className="rounded-md text-xs px-8" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
