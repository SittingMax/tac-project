import { cn } from '@/lib/utils';
// Use the Lucide React loader icon which has standard props and is used everywhere else
import { Loader2 } from 'lucide-react';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return <Loader2 className={cn('size-4 animate-spin', className)} {...props} />;
}

export { Spinner };
