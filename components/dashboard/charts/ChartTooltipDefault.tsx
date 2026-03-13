'use client';

import { useMemo } from 'react';
import { Bar, BarChart, XAxis } from 'recharts';
import { format, startOfDay, subDays } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { useShipments } from '@/hooks/useShipments';

export const description = 'A stacked bar chart with a legend';
export const iframeHeight = '600px';
export const containerClassName =
  '[&>div]:w-full [&>div]:max-w-md flex items-center justify-center min-h-svh';

const chartConfig = {
  created: {
    label: 'Created',
    color: 'var(--chart-1)',
  },
  delivered: {
    label: 'Delivered',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function ChartTooltipDefault() {
  const { data: shipments = [], isLoading } = useShipments({ limit: 1000 });

  const chartData = useMemo(() => {
    const dateMap = new Map<string, { created: number; delivered: number }>();

    for (let i = 5; i >= 0; i -= 1) {
      const date = startOfDay(subDays(new Date(), i));
      dateMap.set(format(date, 'yyyy-MM-dd'), { created: 0, delivered: 0 });
    }

    shipments.forEach((shipment) => {
      if (shipment.created_at) {
        const createdKey = format(startOfDay(new Date(shipment.created_at)), 'yyyy-MM-dd');
        const createdDay = dateMap.get(createdKey);
        if (createdDay) {
          createdDay.created += 1;
        }
      }

      if (shipment.delivered_at) {
        const deliveredKey = format(startOfDay(new Date(shipment.delivered_at)), 'yyyy-MM-dd');
        const deliveredDay = dateMap.get(deliveredKey);
        if (deliveredDay) {
          deliveredDay.delivered += 1;
        }
      }
    });

    return Array.from(dateMap.entries()).map(([date, counts]) => ({ date, ...counts }));
  }, [shipments]);

  if (isLoading) {
    return <ChartSkeleton height={200} />;
  }

  if (chartData.every((item) => item.created === 0 && item.delivered === 0)) {
    return (
      <Card className="flex flex-col h-full border border-border bg-card shadow-sm hover:bg-muted/5 transition-colors duration-300 w-full">
        <CardHeader className="pb-4 border-b border-border space-y-0">
          <CardTitle className="text-xs text-muted-foreground">Shipment Throughput</CardTitle>
          <div className="text-lg font-semibold text-foreground mt-1">Created vs Delivered</div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No shipment activity available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full border border-border bg-card shadow-sm hover:bg-muted/5 transition-colors duration-300 w-full">
      <CardHeader className="pb-4 border-b border-border space-y-0">
        <CardTitle className="text-xs text-muted-foreground">Shipment Throughput</CardTitle>
        <div className="text-lg font-semibold text-foreground mt-1">Created vs Delivered</div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1">
        <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString('en-US', {
                  weekday: 'short',
                });
              }}
            />
            <Bar dataKey="created" stackId="a" fill="var(--color-created)" radius={0} />
            <Bar dataKey="delivered" stackId="a" fill="var(--color-delivered)" radius={0} />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} defaultIndex={1} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
