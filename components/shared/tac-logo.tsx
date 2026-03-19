import { Link } from 'react-router-dom';
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
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          s.icon,
          'flex shrink-0 items-center justify-center bg-foreground text-background rounded-sm shadow-sm'
        )}
      >
        <svg
          className={cn(s.iconSvg)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <rect x="2" y="2" width="20" height="20" />
          <path d="M12 2v20" />
          <path d="M2 12h10" />
          <circle cx="17" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col justify-center">
          {!showSubtitle && (
            <span
              className={cn(s.text, 'font-extrabold tracking-tighter leading-none text-foreground')}
              style={{ letterSpacing: '-0.05em' }}
            >
              TAC
            </span>
          )}
          {showSubtitle && (
            <span
              className={cn(
                s.text,
                'font-extrabold tracking-tighter leading-none text-foreground flex-col'
              )}
              style={{ letterSpacing: '-0.05em' }}
            >
              <span>TAC</span>
              <span
                className="text-[8px] font-mono font-bold uppercase tracking-[0.3em] text-muted-foreground mt-0.5 whitespace-nowrap leading-none"
                style={{ letterSpacing: '0.3em' }}
              >
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
      <Link
        to={linkTo}
        className="flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {content}
      </Link>
    );
  }

  return content;
}
