import { Button } from '@/components/ui/button';

export interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center border border-destructive/20 bg-destructive/5">
      <div className="mx-auto max-w-md text-center space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tighter text-destructive">{title}</h2>
        <p className="text-xs font-mono uppercase tracking-widest text-destructive/80">{description}</p>
        {onRetry && (
          <div className="pt-4">
            <Button variant="destructive" className="rounded-none uppercase font-mono tracking-widest text-xs px-8" onClick={onRetry}>
              Execute Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
