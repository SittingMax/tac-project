'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Wifi, Radio, Globe, Activity } from 'lucide-react';

export function HeroOverlays() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden text-primary/80 font-mono text-[10px] md:text-xs select-none">
      {/* Top Left: System Clock & Coordinates */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute top-24 left-6 hidden md:flex flex-col gap-1"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-3 h-3 animate-pulse" />
          <span>WGS_SAT_UPLINK_V4.2</span>
        </div>
        <div className="text-muted-foreground">LAT: 26.1445° N | LON: 91.7362° E</div>
        <div className="text-primary font-bold">
          {time.toLocaleTimeString('en-US', { hour12: false })} UTC
        </div>
      </motion.div>

      {/* Top Right: Network Status */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute top-24 right-6 hidden md:flex flex-col items-end gap-2"
      >
        <Badge
          variant="outline"
          className="bg-background/20 backdrop-blur-md border-primary/20 text-primary gap-2"
        >
          <div className="w-2 h-2 rounded-none bg-status-live animate-pulse" />
          SYSTEM_OPTIMAL
        </Badge>
        <div className="flex items-center gap-4 text-muted-foreground/60">
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3" /> 100%
          </div>
          <div className="flex items-center gap-1">
            <Radio className="w-3 h-3" /> 5G_WGS
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" /> LOW_LATENCY
          </div>
        </div>
      </motion.div>

      {/* Decorative Crosshairs */}
      <div className="absolute top-1/4 left-1/4 w-4 h-4 border-t border-l border-primary/20 opacity-50" />
      <div className="absolute bottom-1/4 right-1/4 w-4 h-4 border-b border-r border-primary/20 opacity-50" />
    </div>
  );
}
