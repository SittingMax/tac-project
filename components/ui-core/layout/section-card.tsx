import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface SectionCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Semantic wrapper for page sections.
 * Wraps shadcn Card with a standard CardHeader and CardContent.
 */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  const hasHeader = title || description || actions;

  return (
    <Card
      className={cn(
        'overflow-hidden transition duration-300 hover:shadow-md hover:border-border/80 relative',
        className
      )}
    >
      {hasHeader && (
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
          <div className="flex flex-col gap-1.5">
            {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
            {description && <CardDescription className="text-sm">{description}</CardDescription>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={cn('p-4 sm:p-6', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
