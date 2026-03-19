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
  headerSlot?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function SizedDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  size = 'md',
  headerSlot,
  footer,
  children,
}: SizedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn('flex flex-col gap-0 p-0 max-h-[85vh] overflow-hidden', sizeClasses[size])}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {headerSlot}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 bg-background/50">{children}</div>
        {footer && <div className="px-6 py-4 border-t bg-muted/20 shrink-0">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
