'use client';

import * as React from 'react';
import { format, startOfDay, subDays } from 'date-fns';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { useShipments } from '@/hooks/useShipments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChartSkeleton } from '@/components/ui/skeleton';

export const description = 'An interactive area chart';

export function RealtimeCorridorActivity() {
  const { data: shipments = [], isLoading } = useShipments({ limit: 1000 });
  const [timeRange, setTimeRange] = React.useState('90d');

  const corridorActivity = React.useMemo(() => {
    const daysToShow = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const dateMap = new Map<string, { primary: number; secondary: number }>();
    const hubCounts = new Map<string, { code: string; label: string; total: number }>();

    for (let i = daysToShow - 1; i >= 0; i -= 1) {
      const day = startOfDay(subDays(new Date(), i));
      dateMap.set(format(day, 'yyyy-MM-dd'), { primary: 0, secondary: 0 });
    }

    shipments.forEach((shipment) => {
      if (!shipment.created_at || !shipment.origin_hub?.code) {
        return;
      }

      const dateKey = format(startOfDay(new Date(shipment.created_at)), 'yyyy-MM-dd');
      if (!dateMap.has(dateKey)) {
        return;
      }

      const existing = hubCounts.get(shipment.origin_hub.code) ?? {
        code: shipment.origin_hub.code,
        label: shipment.origin_hub.name || shipment.origin_hub.code,
        total: 0,
      };

      existing.total += 1;
      hubCounts.set(shipment.origin_hub.code, existing);
    });

    const [primaryHub, secondaryHub] = Array.from(hubCounts.values()).sort(
      (a, b) => b.total - a.total
    );

    shipments.forEach((shipment) => {
      if (!shipment.created_at || !shipment.origin_hub?.code) {
        return;
      }

      const dateKey = format(startOfDay(new Date(shipment.created_at)), 'yyyy-MM-dd');
      const day = dateMap.get(dateKey);

      if (!day) {
        return;
      }

      if (shipment.origin_hub.code === primaryHub?.code) {
        day.primary += 1;
      } else if (shipment.origin_hub.code === secondaryHub?.code) {
        day.secondary += 1;
      }
    });

    const chartData = Array.from(dateMap.entries()).map(([date, counts]) => ({ date, ...counts }));
    const chartConfig: ChartConfig = {
      primary: {
        label: primaryHub?.label ?? 'Primary Origin Hub',
        color: 'var(--chart-1)',
      },
      secondary: {
        label: secondaryHub?.label ?? 'Secondary Origin Hub',
        color: 'var(--chart-2)',
      },
    };

    return {
      chartConfig,
      chartData,
      hasData: chartData.some((item) => item.primary > 0 || item.secondary > 0),
    };
  }, [shipments, timeRange]);

  if (isLoading) {
    return <ChartSkeleton height={350} />;
  }

  if (!corridorActivity.hasData) {
    return (
      <Card className="flex flex-col py-0 border border-border bg-card shadow-sm w-full hover:bg-muted/5 transition-colors duration-300">
        <CardHeader className="flex flex-col items-stretch border-b border-border pb-4 sm:flex-row space-y-0">
          <div className="grid flex-1 gap-1">
            <CardTitle className="text-xs text-muted-foreground">
              Corridor Shipment Activity
            </CardTitle>
            <div className="text-lg font-semibold text-foreground mt-1">Top Origin Hubs</div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No corridor shipment activity available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col py-0 border border-border/40 bg-card shadow-sm w-full hover:bg-muted/5 transition-colors duration-300">
      <CardHeader className="flex flex-col items-stretch border-b border-border/40 pb-4 sm:flex-row space-y-0">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-xs text-muted-foreground">
            Corridor Shipment Activity
          </CardTitle>
          <div className="text-lg font-semibold text-foreground mt-1">Top Origin Hubs</div>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] border-border bg-muted/10 text-xs sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={corridorActivity.chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <AreaChart data={corridorActivity.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillSecondary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 4"
              stroke="var(--border)"
              opacity={0.2}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={
                <ChartTooltipContent
                  className="backdrop-blur-xl bg-background/80 border-border/50 shadow-xl rounded-xl"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="secondary"
              type="monotone"
              fill="url(#fillSecondary)"
              stroke="var(--color-secondary)"
              strokeWidth={3}
            />
            <Area
              dataKey="primary"
              type="monotone"
              fill="url(#fillPrimary)"
              stroke="var(--color-primary)"
              strokeWidth={3}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
