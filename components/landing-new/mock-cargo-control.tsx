import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Activity, Box, Database, Globe, Network, Shield } from 'lucide-react';

const mockTelemetryData = Array.from({ length: 20 }).map((_, i) => ({
  time: i,
  latency: Math.floor(Math.random() * 20) + 10,
  throughput: Math.floor(Math.random() * 500) + 500,
}));

export function MockCargoControlCenter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
      className="w-full max-w-5xl mx-auto mt-8 relative"
      style={{ perspective: '1000px' }}
    >
      {/* Outer Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-none blur-2xl opacity-50" />

      {/* Main Container */}
      <div className="relative rounded-none border border-border bg-card/80 backdrop-blur-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[400px] md:h-[500px]">
        {/* Fake Sidebar */}
        <div className="hidden md:flex flex-col w-16 border-r border-border bg-foreground/[0.02] items-center py-6 gap-6 z-10">
          <div className="w-8 h-8 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Box className="w-4 h-4 text-primary" />
          </div>
          <Globe className="w-5 h-5 text-foreground/40 hover:text-foreground transition-colors cursor-pointer" />
          <Network className="w-5 h-5 text-foreground/40 hover:text-foreground transition-colors cursor-pointer" />
          <Database className="w-5 h-5 text-foreground/40 hover:text-foreground transition-colors cursor-pointer" />
          <Shield className="w-5 h-5 text-foreground/40 hover:text-foreground transition-colors cursor-pointer mt-auto" />
        </div>

        {/* Fake Main Content Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Fake Header */}
          <div className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-foreground/[0.01]">
            <div className="flex gap-2.5 items-center">
              <div className="w-3 h-3 rounded-none bg-destructive/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-none bg-destructive" />
              </div>
              <div className="w-3 h-3 rounded-none bg-orange-500/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-none bg-orange-500" />
              </div>
              <div className="w-3 h-3 rounded-none bg-primary/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-none bg-primary" />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-none px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-none h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
                Live Connected
              </span>
            </div>
          </div>

          {/* Fake Dashboard Body */}
          <div className="flex-1 p-6 flex flex-col gap-6 relative z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-foreground/[0.03] to-transparent">
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Network Latency', value: '12ms', color: 'text-primary' },
                { label: 'Active Nodes', value: '1,492', color: 'text-foreground' },
                { label: 'Throughput', value: '42.8 GB/s', color: 'text-foreground' },
                { label: 'Global Load', value: '38%', color: 'text-chart-2' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-none border border-border bg-foreground/[0.02] p-4 flex flex-col gap-1 backdrop-blur-md"
                >
                  <span className="text-xs font-mono text-foreground/40 uppercase">
                    {stat.label}
                  </span>
                  <span
                    className={`text-xl md:text-2xl font-semibold tracking-tight ${stat.color}`}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Main Graph Area */}
            <div className="flex-1 rounded-none border border-border bg-foreground/[0.01] overflow-hidden relative group">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground/80">
                  Global Telemetry Stream
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-3/4 opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTelemetryData}>
                    <defs>
                      <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="throughput"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorThroughput)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Overlay lines to look like IDE/Grid */}
              <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-100 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
