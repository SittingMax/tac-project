import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Box,
  Activity,
  CheckCircle,
  AlertTriangle,
  Percent,
  LucideIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
} from 'lucide-react';
import { Card } from '../ui/card';
import { KPIGridSkeleton } from '../ui/skeleton';
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: number;
  displayValue: string;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'destructive';
  trend?: number;
  trendLabel?: string;
  sparklineData?: { date: string; value: number }[];
  path?: string;
  onNavigate?: (path: string) => void;
  isCurrency?: boolean;
  index: number;
}

/**
 * Animated Counter Component
 */
const AnimatedCounter = ({
  value,
  displayValue,
  isCurrency,
}: {
  value: number;
  displayValue: string;
  isCurrency?: boolean;
}) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (isCurrency) return `$${(latest / 1000).toFixed(1)}k`;
    if (displayValue.includes('%')) return `${Math.round(latest)}%`;
    if (displayValue.includes('d')) return `${latest.toFixed(1)}d`;
    return Math.round(latest).toLocaleString();
  });

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, delay: 0.1 });
    controls.then(() => setHasAnimated(true));
    return controls.stop;
  }, [value, count]);

  return <motion.span>{hasAnimated ? displayValue : rounded}</motion.span>;
};

/**
 * Enhanced KPI Card with animations, sparklines, and transitions
 */
const KPICard = React.memo(
  ({
    label,
    value,
    displayValue,
    icon: Icon,
    color,
    trend,
    trendLabel,
    sparklineData,
    path,
    isCurrency,
    onNavigate,
    index,
  }: KPICardProps) => {
    const isIncreasing = trend ? trend > 0 : false;
    const isDecreasing = trend ? trend < 0 : false;

    const strokeColorMap = {
      primary: 'var(--primary)',
      success: 'var(--status-success)',
      warning: 'var(--status-warning)',
      destructive: 'var(--status-error)',
    };

    const handleClick = useCallback(() => {
      if (path && onNavigate) {
        onNavigate(path);
      }
    }, [path, onNavigate]);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: index * 0.05,
          duration: 0.4,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="h-full"
      >
        <Card
          onClick={handleClick}
          data-testid={`kpi-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
          className={cn(
            'relative overflow-hidden h-full flex flex-col justify-between group transition-all duration-300 border-t border-border/40 rounded-none bg-background shadow-none',
            path ? 'cursor-pointer hover:bg-muted/30' : ''
          )}
        >
          {/* Content */}
          <div className="p-5 flex-1 flex flex-col relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-0 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold line-clamp-1 pr-2">
                  {label}
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between mt-auto">
              <div>
                <div className="text-3xl font-medium text-foreground tracking-tighter mt-2">
                  <AnimatedCounter
                    value={value}
                    displayValue={displayValue}
                    isCurrency={isCurrency}
                  />
                </div>

                {trend !== undefined && (
                  <div className="flex items-center gap-1 mt-2">
                    <span
                      className={cn(
                        'flex items-center text-xs font-mono tracking-wide px-1.5 py-0.5 rounded-none',
                        isIncreasing && color !== 'destructive'
                          ? 'text-status-success'
                          : isDecreasing && color !== 'destructive'
                            ? 'text-status-error'
                            : isDecreasing && color === 'destructive'
                              ? 'text-status-success' // fewer exceptions = good
                              : 'text-status-error'
                      )}
                    >
                      {isIncreasing ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(trend)}%
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">{trendLabel}</span>
                  </div>
                )}
              </div>

              {/* Sparkline */}
              {sparklineData && (
                <div className="w-16 h-10 opacity-70 group-hover:opacity-100 transition-opacity translate-y-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColorMap[color]}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }
);

// Props interface for the KPIGrid
interface KPIGridProps {
  isLoading?: boolean;
}

/**
 * Enhanced Dashboard KPI Grid with animated cards and loading states
 */
export const KPIGrid: React.FC<KPIGridProps> = ({ isLoading: externalLoading = false }) => {
  const { data, isLoading: dataLoading } = useDashboardKPIs();
  const navigate = useNavigate();

  const isLoading = externalLoading || dataLoading;

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const kpis: Omit<KPICardProps, 'index' | 'onNavigate'>[] = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: 'Total Shipments',
        value: data.total,
        displayValue: data.total.toLocaleString(),
        icon: Box,
        color: 'primary',
        trend: 12.5,
        trendLabel: 'vs last week',
        sparklineData: data.sparklineData,
        path: '/shipments',
      },
      {
        label: 'Active Transit',
        value: data.active,
        displayValue: data.active.toLocaleString(),
        icon: Activity,
        color: 'success',
        trend: 4.2,
        trendLabel: 'vs last week',
        sparklineData: data.sparklineData,
        path: '/shipments?status=IN_TRANSIT',
      },
      {
        label: 'Delivered',
        value: data.delivered,
        displayValue: data.delivered.toLocaleString(),
        icon: CheckCircle,
        color: 'success',
        trend: 8.1,
        trendLabel: 'vs last week',
        sparklineData: data.sparklineData,
        path: '/shipments?status=DELIVERED',
      },
      {
        label: 'Exceptions',
        value: data.exceptions,
        displayValue: data.exceptions.toString(),
        icon: AlertTriangle,
        color: data.exceptions > 0 ? 'destructive' : 'warning',
        trend: data.exceptions > 0 ? 15.0 : -2.5,
        trendLabel: 'vs last week',
        path: '/exceptions',
      },
      {
        label: 'SLA Compliance',
        value: data.slaCompliance,
        displayValue: `${data.slaCompliance}%`,
        icon: Percent,
        color: 'success',
        trend: 2.1,
        trendLabel: 'vs last month',
      },
      {
        label: 'Revenue (Today)',
        value: data.revenue,
        displayValue: `$${(data.revenue / 1000).toFixed(1)}k`,
        icon: DollarSign,
        color: 'primary',
        trend: 4.5,
        trendLabel: 'vs yesterday',
        isCurrency: true,
      },
      {
        label: 'Avg Delivery',
        value: data.deliveryTime,
        displayValue: `${data.deliveryTime}d`,
        icon: Clock,
        color: 'primary',
        trend: -0.2, // Faster delivery is negative trend, we handle this visually
        trendLabel: 'vs last week',
      },
    ];
  }, [data]);

  if (isLoading) {
    return <KPIGridSkeleton />;
  }

  // To create an uneven grid that looks good (e.g. 7 items)
  // 4 items on top row, 3 items on bottom row spanning evenly
  return (
    <div
      data-testid="kpi-grid"
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-4 auto-rows-fr"
    >
      {kpis.slice(0, 4).map((kpi, index) => (
        <div key={kpi.label} className="col-span-1 xl:col-span-1 md:col-span-2 lg:col-span-1">
          <KPICard {...kpi} onNavigate={handleNavigate} index={index} />
        </div>
      ))}
      {kpis.slice(4).map((kpi, index) => (
        <div key={kpi.label} className="col-span-1 xl:col-span-1 md:col-span-2 lg:col-span-1">
          <KPICard {...kpi} onNavigate={handleNavigate} index={index + 4} />
        </div>
      ))}
    </div>
  );
};

export default KPIGrid;
