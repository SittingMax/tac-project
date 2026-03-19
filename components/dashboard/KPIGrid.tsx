import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Box,
  Activity,
  CheckCircle,
  AlertTriangle,
  Percent,
  LucideIcon,
  DollarSign,
  Clock,
} from 'lucide-react';
import { AppIcon } from '@/components/ui-core';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { KPIGridSkeleton } from '../ui/skeleton';
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { hasRoleAccess } from '@/lib/access-control';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

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
    if (isCurrency) return `₹${Math.round(latest).toLocaleString('en-IN')}`;
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
 * Enhanced KPI Card matching Shadcn Blocks metrics card style
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

    const strokeColorMap: Record<string, string> = {
      primary: 'hsl(var(--primary))',
      success: 'hsl(var(--chart-2))',
      warning: 'hsl(var(--chart-3))',
      destructive: 'hsl(var(--chart-4))',
    };

    const handleClick = useCallback(() => {
      if (path && onNavigate) {
        onNavigate(path);
      }
    }, [path, onNavigate]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="h-full"
      >
        <Card
          onClick={handleClick}
          data-testid={`kpi-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
          className={cn(
            'relative overflow-hidden h-full flex flex-col justify-between group transition-all duration-300',
            'border border-border/40 bg-card hover:shadow-md hover:border-primary/40',
            path ? 'cursor-pointer' : ''
          )}
        >
          {/* Background Icon */}
          <div className="absolute -top-4 -right-4 p-4 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity pointer-events-none transform group-hover:scale-110 duration-500 z-0">
            <AppIcon icon={Icon} size={32} className="w-32 h-32" />
          </div>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 z-10">
            <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
            <AppIcon
              icon={Icon}
              size={16}
              className="text-muted-foreground/30 transition-colors group-hover:text-foreground/50"
            />
          </CardHeader>

          <CardContent className="z-10 p-4 pt-0 pb-6">
            <div className="flex flex-col gap-1">
              <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                <AnimatedCounter
                  value={value}
                  displayValue={displayValue}
                  isCurrency={isCurrency}
                />
              </div>

              {trend !== undefined && (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      'text-[11px] font-mono tracking-wider px-1.5 py-0.5 rounded-sm leading-none',
                      isIncreasing && color !== 'destructive'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : isDecreasing && color !== 'destructive'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : isDecreasing && color === 'destructive'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {isIncreasing ? '+' : ''}
                    {trend}%
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {trendLabel}
                  </span>
                </div>
              )}
            </div>
          </CardContent>

          {/* Minimalist Sparkline Background Layer */}
          {sparklineData && (
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity duration-500 mask-image:linear-gradient(to_bottom,transparent,black)">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="step"
                    dataKey="value"
                    stroke={strokeColorMap[color]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
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
  const userRole = useAuthStore((state) => state.user?.role);

  const isLoading = externalLoading || dataLoading;

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const kpis: Omit<KPICardProps, 'index' | 'onNavigate'>[] = useMemo(() => {
    if (!data) return [];

    const revenueDisplay = `₹${Math.round(data.revenue).toLocaleString('en-IN')}`;

    return [
      {
        label: 'Total Shipments',
        value: data.total,
        displayValue: data.total.toLocaleString(),
        icon: Box,
        color: 'primary',
        sparklineData: data.sparklineData,
        path: '/shipments',
      },
      {
        label: 'Active Transit',
        value: data.active,
        displayValue: data.active.toLocaleString(),
        icon: Activity,
        color: 'success',
        sparklineData: data.sparklineData,
        path: '/shipments?status=IN_TRANSIT',
      },
      {
        label: 'Delivered',
        value: data.delivered,
        displayValue: data.delivered.toLocaleString(),
        icon: CheckCircle,
        color: 'success',
        sparklineData: data.sparklineData,
        path: '/shipments?status=DELIVERED',
      },
      {
        label: 'Exceptions',
        value: data.exceptions,
        displayValue: data.exceptions.toString(),
        icon: AlertTriangle,
        color: data.exceptions > 0 ? 'destructive' : 'warning',
        path: hasRoleAccess(userRole, ['ADMIN', 'MANAGER', 'OPS_STAFF', 'WAREHOUSE_STAFF'])
          ? '/exceptions'
          : undefined,
      },
      {
        label: 'SLA Compliance',
        value: data.slaCompliance,
        displayValue: `${data.slaCompliance}%`,
        icon: Percent,
        color: 'success',
        path: '/shipments?status=DELIVERED',
      },
      {
        label: 'Revenue (Today)',
        value: data.revenue,
        displayValue: revenueDisplay,
        icon: DollarSign,
        color: 'primary',
        isCurrency: true,
        path: hasRoleAccess(userRole, ['ADMIN', 'MANAGER', 'FINANCE_STAFF'])
          ? '/finance'
          : undefined,
      },
      {
        label: 'Avg Delivery',
        value: data.deliveryTime,
        displayValue: `${data.deliveryTime}d`,
        icon: Clock,
        color: 'primary',
        path: '/shipments?status=DELIVERED',
      },
    ];
  }, [data, userRole]);

  if (isLoading) {
    return <KPIGridSkeleton />;
  }

  return (
    <div data-testid="kpi-grid" className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard key={kpi.label} {...kpi} onNavigate={handleNavigate} index={index} />
        ))}
      </div>
    </div>
  );
};

export default KPIGrid;
