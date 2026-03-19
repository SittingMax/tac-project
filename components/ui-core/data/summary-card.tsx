import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

interface SummaryCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SummaryCard({ title, icon: Icon, children, className, action }: SummaryCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}
