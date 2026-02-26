'use client';

import { motion } from '@/lib/motion';

export function SystemTicker() {
  return (
    <div className="w-full bg-muted/50 border-y border-border backdrop-blur-md overflow-hidden py-3 z-20 relative">
      <div className="flex w-full mask-linear-fade max-w-[100vw]">
        <motion.div
          className="flex whitespace-nowrap items-center"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: 40,
          }}
        >
          {[...Array(4)].map((_, groupIndex) => (
            <div key={groupIndex} className="flex items-center">
              {/* Item 1 */}
              <div className="flex items-center mx-8">
                <span className="w-1.5 h-1.5 rounded-none bg-primary animate-pulse mr-3" />
                <span className="text-foreground font-bold font-mono text-xs tracking-wider mr-2">
                  PKT_8829{groupIndex}
                </span>
                <span className="text-muted-foreground font-mono text-xs tracking-tight">
                  CLEARED CUSTOMS (DEL)
                </span>
              </div>
              {/* Item 2 */}
              <div className="flex items-center mx-8">
                <span className="w-1.5 h-1.5 rounded-none bg-chart-2 animate-pulse mr-3" />
                <span className="text-foreground font-bold font-mono text-xs tracking-wider mr-2">
                  FLT_WGS-902
                </span>
                <span className="text-muted-foreground font-mono text-xs tracking-tight">
                  ARRIVED (BOM)
                </span>
              </div>
              {/* Item 3 */}
              <div className="flex items-center mx-8">
                <span className="w-1.5 h-1.5 rounded-none bg-chart-4 animate-pulse mr-3" />
                <span className="text-foreground font-bold font-mono text-xs tracking-wider mr-2">
                  NODE_DXB
                </span>
                <span className="text-muted-foreground font-mono text-xs tracking-tight">
                  ONLINE (HUB)
                </span>
              </div>
              {/* Separator Graphic */}
              <div className="mx-4 text-border text-xs font-mono">///</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
