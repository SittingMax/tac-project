import { useMemo } from 'react';
import { Card } from '../ui/card';
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';

export const OperationalHealth = () => {
  const { data, isLoading } = useDashboardKPIs();

  const healthData = useMemo(() => {
    // Mocking a composite score calculation based on the KPIs
    // In a real app, this would be computed server-side or more rigorously
    const deliveryScore = data?.slaCompliance ?? 0;
    const exceptionPenalty = Math.min((data?.exceptions || 0) * 2, 20);
    const speedScore = Math.max(100 - (data?.deliveryTime || 0) * 10, 50);

    const compositeScore = Math.round(deliveryScore * 0.5 + speedScore * 0.5 - exceptionPenalty);
    const normalizedScore = Math.max(0, Math.min(100, compositeScore));

    let status: 'healthy' | 'warning' | 'critical' | 'loading' = 'healthy'; // Add 'loading' to type
    let color = 'text-status-success';
    let bgLayer = 'bg-status-success/10';
    let strokeColor = 'var(--status-success)';

    if (normalizedScore < 70) {
      status = 'warning';
      color = 'text-status-warning';
      bgLayer = 'bg-status-warning/10';
      strokeColor = 'var(--status-warning)';
    }
    if (normalizedScore < 50) {
      status = 'critical';
      color = 'text-status-error';
      bgLayer = 'bg-status-error/10';
      strokeColor = 'var(--status-error)';
    }

    return {
      score: normalizedScore,
      status,
      color,
      bgLayer,
      strokeColor,
      metrics: [
        { label: 'SLA Output', value: deliveryScore, icon: ShieldCheck, target: 95 },
        { label: 'Velocity', value: speedScore, icon: Zap, target: 80 },
        {
          label: 'Exception Drag',
          value: exceptionPenalty,
          icon: AlertCircle,
          target: 0,
          invert: true,
        },
      ],
    };
  }, [data]);

  // SVG Radial Math
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Only calculate strokeDashoffset if score is available
  const strokeDashoffset =
    healthData.score !== null
      ? circumference - (healthData.score / 100) * circumference
      : circumference; // Default to full circle for loading or 0 score

  return (
    <Card className="h-[420px] border-border/50 flex flex-col p-6 bg-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-none blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />

      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Operational Health</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative -mt-4">
        {/* Radial Gauge */}
        <div className="relative w-48 h-48 flex flex-col items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            {/* Background Track */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-muted/20"
            />
            {/* Animated Score Bar */}
            <motion.circle
              cx="96"
              cy="96"
              r={radius}
              stroke={healthData.strokeColor}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Value */}
          <div className="text-center z-10 flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="w-24 h-12 bg-muted animate-pulse rounded-md" />
            ) : (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className={cn('text-5xl font-black font-mono tracking-tighter', healthData.color)}
              >
                {healthData.score}
              </motion.div>
            )}
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">
              Score
            </div>
          </div>
        </div>

        <div
          className={cn(
            'mt-6 px-4 py-1.5 rounded-none text-sm font-semibold border flex items-center gap-2',
            healthData.bgLayer,
            healthData.color,
            'border-current/20'
          )}
        >
          {healthData.status === 'healthy' && <ShieldCheck className="w-4 h-4" />}
          {healthData.status === 'warning' && <AlertCircle className="w-4 h-4" />}
          {healthData.status === 'critical' && <AlertCircle className="w-4 h-4" />}
          System {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="space-y-4 mt-6">
        {healthData.metrics.map((metric, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 cursor-help group"
            title="Score breakdown contribution"
          >
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                <metric.icon className="w-4 h-4 opacity-70" />
                <span>{metric.label}</span>
              </div>
              <span className="font-semibold font-mono">
                {metric.value}
                {metric.invert ? ` pts` : '%'}
              </span>
            </div>
            <Progress
              value={metric.invert ? (metric.value / 20) * 100 : metric.value}
              className="h-1.5 bg-muted"
            />
          </div>
        ))}
      </div>
    </Card>
  );
};
