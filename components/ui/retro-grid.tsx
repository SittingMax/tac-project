import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface RetroGridProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lightLineColor?: string;
  darkLineColor?: string;
}

export function RetroGrid({
  className,
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = 'gray',
  darkLineColor = 'gray',
  ...props
}: RetroGridProps) {
  const gridStyles = {
    '--grid-angle': `${angle}deg`,
    '--cell-size': `${cellSize}px`,
    '--light-line': lightLineColor,
    '--dark-line': darkLineColor,
    opacity,
  } as CSSProperties;

  const gridPattern = {
    backgroundImage:
      'linear-gradient(to right, var(--grid-line) 1px, transparent 0), linear-gradient(to bottom, var(--grid-line) 1px, transparent 0)',
    backgroundSize: 'var(--cell-size) var(--cell-size)',
    backgroundRepeat: 'repeat',
  } as CSSProperties;

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]',
        className
      )}
      style={gridStyles}
      {...props}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))] [--grid-line:var(--light-line)] dark:[--grid-line:var(--dark-line)]">
        <div
          className="absolute inset-0 animate-grid [margin-left:-200%] [height:300vh] [width:600vw] [transform-origin:100%_0_0] will-change-transform"
          style={gridPattern}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-background/30 to-transparent" />
    </div>
  );
}
