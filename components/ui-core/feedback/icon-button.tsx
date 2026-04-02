import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type Variant = 'ghost' | 'outline' | 'secondary' | 'destructive';
type Size = 'sm' | 'default';

interface IconButtonProps {
  /** Required: used as accessible aria-label and tooltip title */
  label: string;
  /** Lucide icon component (pass the component reference, not JSX) */
  icon: LucideIcon;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  /** Additional icon size in px — defaults to 16 */
  iconSize?: number;
  /** Icon stroke width — defaults to 1.5 */
  iconStrokeWidth?: number;
}

/**
 * IconButton — accessible icon-only button.
 *
 * Enforces:
 * - Mandatory `aria-label` (mapped from `label` prop)
 * - `title` tooltip (same as label)
 * - Canonical icon sizing (size=16, strokeWidth=1.5) by default
 * - ShadCN variant/size forwarding
 *
 * @example
 * <IconButton label="Archive message" icon={Archive} onClick={handleArchive} />
 */
export function IconButton({
  label,
  icon: Icon,
  onClick,
  variant = 'ghost',
  size = 'sm',
  disabled,
  className,
  iconSize = 16,
  iconStrokeWidth = 1.5,
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(size === 'sm' ? 'h-8 w-8' : 'h-9 w-9', className)}
    >
      <Icon size={iconSize} strokeWidth={iconStrokeWidth} />
    </Button>
  );
}
