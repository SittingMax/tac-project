import * as React from 'react';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { Link } from 'react-router-dom';

interface IdBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  entity:
    | 'shipment'
    | 'invoice'
    | 'customer'
    | 'manifest'
    | 'booking'
    | 'user'
    | 'message'
    | 'exception';
  idValue: string;
  cnNumber?: string;
  copiable?: boolean;
  href?: string;
}

const prefixMap = {
  shipment: 'CN',
  invoice: 'INV',
  customer: 'CUS',
  manifest: 'MNF',
  booking: 'BKG',
  user: 'USR',
  message: 'MSG',
  exception: 'EXC',
};

function formatId(prefix: string, id: string): string {
  // If it's already properly formatted (e.g. CN-2026-0001), just return it
  if (id.startsWith(`${prefix}-`)) return id;
  // Fallback: take first 8 chars of UUID
  return `${prefix}-${id.substring(0, 8).toUpperCase()}`;
}

export function IdBadge({
  entity,
  idValue,
  cnNumber,
  copiable = true,
  className,
  href,
  ...props
}: IdBadgeProps) {
  const [copied, setCopied] = React.useState(false);

  const prefix = prefixMap[entity];
  // If cnNumber (or any custom display code) is provided, prefer it over the formatted ID
  const displayValue = cnNumber ? cnNumber : formatId(prefix, idValue);

  const handleCopy = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(displayValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    [displayValue]
  );

  const content = (
    <>
      <span className={cn(href && 'hover:underline')}>{displayValue}</span>
      {copiable && (
        <span title={copiable ? 'Click to copy' : undefined}>
          <HugeiconsIcon
            icon={copied ? Tick02Icon : Copy01Icon}
            className={cn('size-3', copied && 'text-status-success')}
            onClick={copiable ? handleCopy : undefined}
          />
        </span>
      )}
    </>
  );

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground',
        copiable &&
          !href &&
          'cursor-pointer hover:bg-muted/80 hover:text-foreground transition-colors',
        className
      )}
      onClick={copiable && !href ? handleCopy : undefined}
      title={copiable && !href ? 'Click to copy' : undefined}
      {...props}
    >
      {href ? (
        <Link
          to={href}
          className="flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
