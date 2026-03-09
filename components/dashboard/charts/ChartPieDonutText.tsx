'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

export const description = 'A donut chart with text';

const chartData = [
  { browser: 'ground', visitors: 4275, fill: 'var(--color-ground)' },
  { browser: 'air', visitors: 1200, fill: 'var(--color-air)' },
  { browser: 'sea', visitors: 287, fill: 'var(--color-sea)' },
];

const chartConfig = {
  visitors: {
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
  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, []);

  return (
    <Card className="flex flex-col h-full rounded-none border border-border/40 bg-transparent shadow-none hover:bg-muted/5 transition-colors duration-300">
      <CardHeader className="items-center pb-4 border-b border-border/40">
        <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Transport Modes</CardTitle>
        <div className="text-xl font-bold tracking-tighter text-foreground mt-1">
          Current Distribution
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
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
                          className="fill-foreground text-4xl font-black tracking-tighter"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground/70 text-[10px] font-mono uppercase tracking-widest"
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
      <CardFooter className="flex-col gap-2 pt-4 border-t border-border/40">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground">
          Ground Transport Dominant <TrendingUp className="h-3 w-3 text-emerald-500" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 text-center">
          Showing distribution across all operational shipments
        </div>
      </CardFooter>
    </Card>
  );
}
