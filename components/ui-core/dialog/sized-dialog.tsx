import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const sizeClasses = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[600px]',
  lg: 'sm:max-w-[800px]',
  xl: 'sm:max-w-[1000px]',
  '5xl': 'sm:max-w-5xl w-[95vw]',
  full: 'sm:max-w-[90vw]',
};

export type DialogSize = keyof typeof sizeClasses;

interface SizedDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: DialogSize;
  children: React.ReactNode;
}

export function SizedDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  size = 'md',
  children,
}: SizedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn('flex flex-col max-h-[90dvh] overflow-hidden p-0 gap-0', sizeClasses[size])}
      >
        <DialogHeader className="shrink-0 px-6 py-5 border-b border-border/40 bg-muted/10">
          <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
          {description && <DialogDescription className="mt-1.5">{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
