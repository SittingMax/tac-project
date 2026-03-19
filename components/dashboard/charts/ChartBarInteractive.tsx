'use client';

import * as React from 'react';
import { format, startOfDay, subDays } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { formatDateShort, formatDate } from '@/lib/formatters';

import { useShipments } from '@/hooks/useShipments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ChartSkeleton } from '@/components/ui/skeleton';

export const description = 'An interactive bar chart';

const chartConfig = {
  shipments: {
    label: 'Shipments',
    color: 'var(--chart-2)',
  },
  packages: {
    label: 'Packages',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function ChartBarInteractive() {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>('shipments');
  const { data: shipments = [], isLoading } = useShipments({ limit: 1000 });

  const chartData = React.useMemo(() => {
    const dateMap = new Map<string, { shipments: number; packages: number }>();

    for (let i = 29; i >= 0; i -= 1) {
      const day = startOfDay(subDays(new Date(), i));
      dateMap.set(format(day, 'yyyy-MM-dd'), { shipments: 0, packages: 0 });
    }

    shipments.forEach((shipment) => {
      if (!shipment.created_at) {
        return;
      }

      const dateKey = format(startOfDay(new Date(shipment.created_at)), 'yyyy-MM-dd');
      const day = dateMap.get(dateKey);

      if (!day) {
        return;
      }

      day.shipments += 1;
      day.packages += Number(shipment.package_count ?? 0);
    });

    return Array.from(dateMap.entries()).map(([date, counts]) => ({ date, ...counts }));
  }, [shipments]);

  const total = React.useMemo(
    () => ({
      shipments: chartData.reduce((acc, curr) => acc + curr.shipments, 0),
      packages: chartData.reduce((acc, curr) => acc + curr.packages, 0),
    }),
    [chartData]
  );

  if (isLoading) {
    return <ChartSkeleton height={250} />;
  }

  if (chartData.every((item) => item.shipments === 0 && item.packages === 0)) {
    return (
      <Card className="flex flex-col py-0 border border-border bg-card shadow-sm w-full hover:bg-muted/5 transition-colors duration-300">
        <CardHeader className="flex flex-col items-stretch border-b border-border !p-0 sm:flex-row">
          <div className="flex-1 flex flex-col justify-center gap-1 px-6 pt-6 pb-4 sm:!py-6">
            <CardTitle className="text-xs text-muted-foreground">Booking Intake</CardTitle>
            <div className="text-lg font-semibold text-foreground mt-1">Shipments vs Packages</div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No shipment intake data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col py-0 border border-border bg-card shadow-sm w-full hover:bg-muted/5 transition-colors duration-300">
      <CardHeader className="flex flex-col items-stretch border-b border-border !p-0 sm:flex-row">
        <div className="flex-1 flex flex-col justify-center gap-1 px-6 pt-6 pb-4 sm:!py-6">
          <CardTitle className="text-xs text-muted-foreground">Booking Intake</CardTitle>
          <div className="text-lg font-semibold text-foreground mt-1">Shipments vs Packages</div>
        </div>
        <div className="flex">
          {['shipments', 'packages'].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/10 data-[active=true]:text-foreground relative z-30 flex-1 flex flex-col justify-center gap-1 border-t border-border/40 px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-muted/5 transition-colors"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">{chartConfig[chart].label}</span>
                <span className="text-xl font-bold tracking-tighter sm:text-3xl text-foreground mt-1">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                return formatDateShort(value);
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px] shadow-xl"
                  labelFormatter={(value) => {
                    return formatDate(value, 'en-US');
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} radius={0} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
