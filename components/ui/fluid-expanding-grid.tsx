'use client';

import { useState } from 'react';
import { motion, LayoutGroup } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
}

interface FluidExpandingGridProps {
  items: GalleryItem[];
  className?: string;
  id?: string;
}

// ... imports remain the same

export default function FluidExpandingGrid({
  items,
  className,
  id = 'fluid-gallery',
}: FluidExpandingGridProps) {
  // ... state logic remains the same (lines 26-55)
  const [layout, setLayout] = useState(() => {
    // Determine initial layout based on item count
    const ids = items.map((item) => item.id);
    return {
      row1: ids.slice(0, 2),
      row2: ids.slice(2, Math.min(items.length, 4)),
    };
  });

  const handleExpand = (id: string) => {
    const inRow1 = layout.row1.includes(id);
    const inRow2 = layout.row2.includes(id);

    // Prevent collapsing if it's the only item in the row
    if ((inRow1 && layout.row1.length === 1) || (inRow2 && layout.row2.length === 1)) return;

    if (inRow1) {
      const neighbor = layout.row1.find((i) => i !== id)!;
      setLayout({
        row1: [id],
        row2: [neighbor, ...layout.row2.filter((i) => i !== neighbor)].slice(0, 2),
      });
    } else {
      const neighbor = layout.row2.find((i) => i !== id)!;
      setLayout({
        row1: [neighbor, ...layout.row1.filter((i) => i !== neighbor)].slice(0, 2),
        row2: [id],
      });
    }
  };

  return (
    <div
      className={cn(
        'w-full h-full flex items-center justify-center overflow-hidden py-12 not-prose',
        className
      )}
    >
      <div className="w-full max-w-7xl px-0">
        <LayoutGroup id={id}>
          <motion.div
            layout
            className="grid grid-cols-2 grid-rows-2 gap-4 w-full h-[400px] sm:h-[600px]"
          >
            {items.map((item, index) => {
              const isRow1 = layout.row1.includes(item.id);
              const rowArr = isRow1 ? layout.row1 : layout.row2;
              const isSelected = rowArr.length === 1 && rowArr[0] === item.id;

              const gridRow = isRow1 ? 1 : 2;
              let gridColumn = '';
              if (isSelected) {
                gridColumn = '1 / span 2';
              } else {
                if (isRow1) {
                  gridColumn = layout.row1.indexOf(item.id) === 0 ? '1' : '2';
                } else {
                  gridColumn = layout.row2.indexOf(item.id) === 0 ? '1' : '2';
                }
              }

              return (
                <motion.div
                  key={item.id}
                  layoutId={`${id}-${item.id}`}
                  onClick={() => handleExpand(item.id)}
                  style={{ gridRow, gridColumn } as React.CSSProperties}
                  className={cn(
                    'relative cursor-pointer group w-full h-full overflow-hidden',
                    isSelected ? 'z-30' : 'z-10'
                  )}
                  transition={{
                    layout: {
                      type: 'spring',
                      stiffness: 100,
                      damping: 25,
                    },
                  }}
                >
                  <motion.div
                    layoutId={`${id}-${item.id}-mask-wrapper`}
                    className="absolute inset-0 overflow-hidden bg-muted/30 border border-border/50 shadow-lg backdrop-blur-sm"
                    style={{ borderRadius: 0 }}
                  >
                    {/* Image with overlay */}
                    <div
                      className={cn(
                        'absolute inset-0 w-full h-full text-primary/20', // Controls SVG stroke color
                        isSelected ? 'text-primary/40' : 'text-primary/20'
                      )}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className={cn(
                          'absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out opacity-100 group-hover:scale-105',
                          isSelected ? 'object-[center_35%] scale-105' : 'object-[center_50%]'
                        )}
                      />
                    </div>
                    <motion.div
                      layoutId={`${id}-${item.id}-mask`}
                      className={cn(
                        'absolute inset-0 transition-colors duration-700 bg-gradient-to-t from-background via-background/60 to-transparent',
                        isSelected ? 'from-background' : 'from-background/90'
                      )}
                    />

                    {/* Technical Grid Overlay */}
                    <div
                      className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/assets/grid-pattern.svg')] bg-repeat"
                      style={{ backgroundSize: '20px 20px' }}
                    />
                  </motion.div>

                  <motion.div
                    layout="position"
                    className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end z-10 select-none"
                  >
                    {/* Top Tech Data */}
                    <div className="absolute top-6 right-6 flex flex-col items-end gap-1 opacity-70">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-none animate-pulse',
                            isSelected ? 'bg-status-live' : 'bg-primary'
                          )}
                        ></div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                          {isSelected ? 'SYSTEM_ACTIVE' : 'STANDBY'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        ID: {item.id.toUpperCase().substring(0, 4)}_0{index + 1}
                      </span>
                    </div>

                    <motion.div layout="position" className="overflow-hidden relative z-20">
                      <motion.h3
                        layout="position"
                        className="text-2xl sm:text-4xl font-bold mb-2 tracking-tight uppercase font-mono group-hover:text-primary transition-colors duration-300"
                        style={{ color: isSelected ? item.color : 'var(--foreground)' }}
                      >
                        {item.title}
                      </motion.h3>
                      <motion.div
                        layout="position"
                        className="h-1 w-12 rounded-none mb-3"
                        style={{ backgroundColor: item.color }}
                      />
                      <motion.p
                        layout="position"
                        className="text-sm sm:text-base text-muted-foreground font-medium max-w-md"
                      >
                        {item.subtitle}
                      </motion.p>
                    </motion.div>
                  </motion.div>

                  {/* Corner Brackets */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-primary/20 rounded-none pointer-events-none group-hover:border-primary/50 transition-colors" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-primary/20 rounded-none pointer-events-none group-hover:border-primary/50 transition-colors" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-primary/20 rounded-none pointer-events-none group-hover:border-primary/50 transition-colors" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-primary/20 rounded-none pointer-events-none group-hover:border-primary/50 transition-colors" />

                  <motion.div
                    layoutId={`${id}-${item.id}-border`}
                    className="absolute inset-0 border border-primary/10 group-hover:border-primary/30 transition-colors duration-500 pointer-events-none"
                    style={{ borderRadius: 0 }}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
}
