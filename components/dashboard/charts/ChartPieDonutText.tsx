'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { useShipments } from '@/hooks/useShipments';

export const description = 'A donut chart with text';

const chartConfig = {
  shipments: {
    label: 'Shipments',
  },
  ground: {
    label: 'Ground',
    color: 'var(--chart-1)',
  },
  air: {
    label: 'Air',
    color: 'var(--chart-2)',
  },
  sea: {
    label: 'Sea',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export function ChartPieDonutText() {
  const { data: shipments = [], isLoading } = useShipments({ limit: 1000 });

  const chartData = React.useMemo(() => {
    const counts = {
      ground: 0,
      air: 0,
      sea: 0,
    };

    shipments.forEach((shipment) => {
      const mode = String(shipment.mode ?? '').toUpperCase();

      if (mode.includes('AIR')) {
        counts.air += 1;
        return;
      }

      if (mode.includes('OCEAN') || mode.includes('SEA')) {
        counts.sea += 1;
        return;
      }

      counts.ground += 1;
    });

    return [
      { mode: 'ground', shipments: counts.ground, fill: 'var(--color-ground)' },
      { mode: 'air', shipments: counts.air, fill: 'var(--color-air)' },
      { mode: 'sea', shipments: counts.sea, fill: 'var(--color-sea)' },
    ];
  }, [shipments]);

  const totalShipments = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.shipments, 0);
  }, [chartData]);

  const dominantMode = React.useMemo(() => {
    return chartData.reduce(
      (top, current) => (current.shipments > top.shipments ? current : top),
      chartData[0]
    );
  }, [chartData]);

  if (isLoading) {
    return <ChartSkeleton height={250} />;
  }

  if (totalShipments === 0) {
    return (
      <Card className="flex flex-col h-full border border-border bg-card shadow-sm hover:bg-muted/5 transition-colors duration-300">
        <CardHeader className="items-center pb-4 border-b border-border">
          <CardTitle className="text-xs text-muted-foreground">Transport Modes</CardTitle>
          <div className="text-lg font-semibold text-foreground mt-1">Current Distribution</div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No shipment mode data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full border border-border bg-card shadow-sm hover:bg-muted/5 transition-colors duration-300">
      <CardHeader className="items-center pb-4 border-b border-border">
        <CardTitle className="text-xs text-muted-foreground">Transport Modes</CardTitle>
        <div className="text-lg font-semibold text-foreground mt-1">Current Distribution</div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="shipments"
              nameKey="mode"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-semibold"
                        >
                          {totalShipments.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs"
                        >
                          Shipments
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          {chartConfig[dominantMode.mode as keyof typeof chartConfig]?.label ?? dominantMode.mode}{' '}
          dominant <TrendingUp size={12} strokeWidth={1.5} className="text-primary" />
        </div>
        <div className="text-xs text-muted-foreground text-center">
          Showing distribution across current shipment records
        </div>
      </CardFooter>
    </Card>
  );
}
