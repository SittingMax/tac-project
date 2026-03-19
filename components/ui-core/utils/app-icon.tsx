import type { LucideIcon } from 'lucide-react';

type IconSize = 16 | 18 | 20 | 24 | 32;

interface AppIconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
}

/**
 * Standardized icon wrapper ensuring consistent stroke-width and size contract.
 */
export function AppIcon({ icon: Icon, size = 16, className }: AppIconProps) {
  return <Icon size={size} strokeWidth={1.5} className={className} />;
}
