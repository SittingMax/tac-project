'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { PolarGrid, RadialBar, RadialBarChart } from 'recharts';

import { useShipments } from '@/hooks/useShipments';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ChartSkeleton } from '@/components/ui/skeleton';

export const description = 'A radial chart with a grid';

export function ChartRadialGrid() {
  const { data: shipments = [], isLoading } = useShipments({ limit: 1000 });

  const radialProfile = React.useMemo(() => {
    const hubMap = new Map<string, { label: string; shipments: number }>();
    const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

    shipments.forEach((shipment) => {
      const hubCode = shipment.origin_hub?.code;
      if (!hubCode) {
        return;
      }

      const existing = hubMap.get(hubCode) ?? {
        label: shipment.origin_hub?.name || hubCode,
        shipments: 0,
      };

      existing.shipments += 1;
      hubMap.set(hubCode, existing);
    });

    const topHubs = Array.from(hubMap.entries())
      .map(([code, summary]) => ({ code, ...summary }))
      .sort((a, b) => b.shipments - a.shipments)
      .slice(0, 4);

    const chartConfig: ChartConfig = {
      shipments: {
        label: 'Shipments',
      },
    };

    topHubs.forEach((hub, index) => {
      chartConfig[`hub${index + 1}`] = {
        label: hub.label,
        color: colors[index],
      };
    });

    const chartData = topHubs.map((hub, index) => ({
      hubKey: `hub${index + 1}`,
      shipments: hub.shipments,
      fill: `var(--color-hub${index + 1})`,
    }));

    return {
      chartConfig,
      chartData,
      leadHub: topHubs[0] ?? null,
      hasData: chartData.length > 0,
    };
  }, [shipments]);

  if (isLoading) {
    return <ChartSkeleton height={250} />;
  }

  if (!radialProfile.hasData) {
    return (
      <Card className="flex flex-col h-full border border-border bg-card shadow-sm hover:bg-muted/5 transition-colors duration-300">
        <CardHeader className="items-center pb-4 border-b border-border">
          <CardTitle className="text-xs text-muted-foreground">Origin Hub Share</CardTitle>
          <div className="text-lg font-semibold text-foreground mt-1">Relative Shipment Volume</div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-0">
          <p className="text-sm text-muted-foreground py-12">
            No origin hub shipment data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full border border-border bg-card shadow-sm hover:bg-muted/5 transition-colors duration-300">
      <CardHeader className="items-center pb-4 border-b border-border">
        <CardTitle className="text-xs text-muted-foreground">Origin Hub Share</CardTitle>
        <div className="text-lg font-semibold text-foreground mt-1">Relative Shipment Volume</div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={radialProfile.chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart data={radialProfile.chartData} innerRadius={30} outerRadius={100}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="hubKey" />}
            />
            <PolarGrid gridType="circle" stroke="var(--border)" opacity={0.3} />
            <RadialBar dataKey="shipments" cornerRadius={0} />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          {radialProfile.leadHub?.label ?? 'Origin hub'} leads shipment share{' '}
          <TrendingUp size={12} strokeWidth={1.5} className="text-primary" />
        </div>
        <div className="text-xs text-muted-foreground text-center">
          Showing relative shipment share by origin hub
        </div>
      </CardFooter>
    </Card>
  );
}
