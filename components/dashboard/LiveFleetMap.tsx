import { Card } from '../ui/card';
import { motion } from 'framer-motion';
import { Map, Plane, Truck, Activity } from 'lucide-react';
import { useShipments } from '@/hooks/useShipments';
import { cn } from '@/lib/utils';

// Abstract map coordinates (percentages)
const HUBS = [
  { id: 'hub-del', code: 'DEL', name: 'New Delhi', x: 15, y: 35 },
  { id: 'hub-ccu', code: 'CCU', name: 'Kolkata', x: 45, y: 65 },
  { id: 'hub-blr', code: 'BLR', name: 'Bangalore', x: 30, y: 85 },
  { id: 'hub-gau', code: 'GAU', name: 'Guwahati', x: 70, y: 40 },
  { id: 'hub-imf', code: 'IMF', name: 'Imphal', x: 88, y: 50 },
];

const ROUTES = [
  { id: 'r1', from: 'DEL', to: 'CCU', type: 'TRUCK' },
  { id: 'r2', from: 'CCU', to: 'GAU', type: 'TRUCK' },
  { id: 'r3', from: 'GAU', to: 'IMF', type: 'TRUCK' },
  { id: 'r4', from: 'DEL', to: 'GAU', type: 'AIR' },
  { id: 'r5', from: 'CCU', to: 'IMF', type: 'AIR' },
  { id: 'r6', from: 'DEL', to: 'BLR', type: 'AIR' },
  { id: 'r7', from: 'CCU', to: 'BLR', type: 'TRUCK' },
];

export const LiveFleetMap = () => {
  const { data: shipments = [] } = useShipments({ limit: 200, status: 'IN_TRANSIT' });

  return (
    <Card className="col-span-1 lg:col-span-2 overflow-hidden flex flex-col relative min-h-[400px] border-border bg-card">
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background pointer-events-none" />

      <div className="p-6 pb-2 relative z-10 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            Live Fleet Map
          </h3>
          <p className="text-sm text-muted-foreground">Real-time corridor activity</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 opacity-80">
            <Plane className="w-3.5 h-3.5 text-chart-2" /> Air Routes
          </span>
          <span className="flex items-center gap-1.5 opacity-80">
            <Truck className="w-3.5 h-3.5 text-primary" /> Ground Routes
          </span>
          <span className="flex items-center gap-1.5 text-primary animate-pulse">
            <Activity className="w-3.5 h-3.5" /> {shipments.length} Active
          </span>
        </div>
      </div>

      <div className="relative flex-1 w-full min-h-[350px]">
        <svg className="absolute inset-0 w-full h-full" overflow="visible">
          {/* Draw Routes */}
          {ROUTES.map((route, index) => {
            const h1 = HUBS.find((h) => h.code === route.from);
            const h2 = HUBS.find((h) => h.code === route.to);
            if (!h1 || !h2) return null;

            const isAir = route.type === 'AIR';
            const strokeColor = isAir ? 'rgba(20, 184, 166, 0.2)' : 'rgba(16, 185, 129, 0.2)';

            // Generate a subtle curve for paths
            const midX = (h1.x + h2.x) / 2;
            const midY = (h1.y + h2.y) / 2 - (isAir ? 15 : 5); // Air routes arc higher

            const pathData = `M ${h1.x}% ${h1.y}% Q ${midX}% ${midY}% ${h2.x}% ${h2.y}%`;

            return (
              <g key={route.id}>
                {/* Base Path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray={isAir ? '4 4' : 'none'}
                />

                {/* Animated active path layer */}
                <motion.path
                  d={pathData}
                  fill="none"
                  stroke={isAir ? 'rgba(20, 184, 166, 0.6)' : 'rgba(16, 185, 129, 0.6)'}
                  strokeWidth="2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                  transition={{
                    duration: isAir ? 3 : 5,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: (index % 5) * 0.5,
                  }}
                />
              </g>
            );
          })}

          {/* Draw Active Shipments (Dots traveling paths) */}
          {/* Note: SVG motion along path is complex in React without dedicated libs, 
              so we'll simulate the dots loosely along the line using simple interpolation or just rely on the path animation above */}
        </svg>

        {/* Draw Hub Nodes as HTML elements for better tooltips/interactivity */}
        {HUBS.map((hub) => (
          <div
            key={hub.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
          >
            {/* Ping animation */}
            <div className="absolute inset-0 rounded-none bg-primary/30 animate-ping group-hover:bg-primary/50" />

            {/* Core dot */}
            <div
              className={cn(
                'relative w-4 h-4 rounded-none border-2 border-background shadow-lg transition-colors z-10',
                'bg-primary/80 group-hover:bg-primary'
              )}
            />

            {/* Label */}
            <div
              className={cn(
                'absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-none bg-background/90 text-xs font-medium border border-border shadow-sm whitespace-nowrap transition-all z-20',
                'opacity-70 scale-95 group-hover:opacity-100 group-hover:scale-100'
              )}
            >
              {hub.name}
              <div className="text-[10px] text-muted-foreground mt-0.5 hidden group-hover:block">
                Code: {hub.code}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
