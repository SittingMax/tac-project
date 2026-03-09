import { Link } from 'react-router-dom';
import { Box } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TacLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  collapsed?: boolean;
  linkTo?: string;
  className?: string;
}

const sizeMap = {
  sm: { icon: 'h-8 w-8', iconSvg: 'h-4 w-4', text: 'text-lg', sub: 'text-[9px]' },
  md: { icon: 'h-9 w-9', iconSvg: 'h-5 w-5', text: 'text-xl', sub: 'text-[10px]' },
  lg: { icon: 'h-10 w-10', iconSvg: 'h-6 w-6', text: 'text-2xl', sub: 'text-[10px]' },
};

export function TacLogo({
  size = 'md',
  showSubtitle = false,
  collapsed = false,
  linkTo = '/',
  className,
}: TacLogoProps) {
  const s = sizeMap[size];

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          s.icon,
          'flex shrink-0 items-center justify-center rounded-none bg-primary/15 shadow-sm ring-1 ring-primary/20'
        )}
      >
        <Box className={cn(s.iconSvg, 'text-primary')} />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          {!showSubtitle && (
            <span className={cn(s.text, 'font-bold tracking-tight leading-none text-foreground')}>
              TAC
            </span>
          )}
          {showSubtitle && (
            <span
              className={cn(
                s.text,
                'font-bold tracking-tight leading-none text-foreground flex flex-col'
              )}
            >
              <span>TAC</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1 whitespace-nowrap">
                Tapan Associate Cargo
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
