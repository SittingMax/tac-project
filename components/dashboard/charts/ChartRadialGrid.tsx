'use client';

import { TrendingUp } from 'lucide-react';
import { PolarGrid, RadialBar, RadialBarChart } from 'recharts';

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

export const description = 'A radial chart with a grid';

const chartData = [
  { browser: 'hubA', visitors: 4275, fill: 'var(--color-hubA)' },
  { browser: 'hubB', visitors: 3200, fill: 'var(--color-hubB)' },
  { browser: 'hubC', visitors: 2187, fill: 'var(--color-hubC)' },
  { browser: 'hubD', visitors: 1173, fill: 'var(--color-hubD)' },
];

const chartConfig = {
  visitors: {
    label: 'Throughput',
  },
  hubA: {
    label: 'Delhi Hub',
    color: 'var(--chart-1)',
  },
  hubB: {
    label: 'Mumbai Hub',
    color: 'var(--chart-2)',
  },
  hubC: {
    label: 'Bengaluru Hub',
    color: 'var(--chart-3)',
  },
  hubD: {
    label: 'Chennai Hub',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

export function ChartRadialGrid() {
  return (
    <Card className="flex flex-col h-full rounded-none border border-border/40 bg-transparent shadow-none hover:bg-muted/5 transition-colors duration-300">
      <CardHeader className="items-center pb-4 border-b border-border/40">
        <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">Hub Efficiency Index</CardTitle>
        <div className="text-xl font-bold tracking-tighter text-foreground mt-1">
          Relative Throughput
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart data={chartData} innerRadius={30} outerRadius={100}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="browser" />}
            />
            <PolarGrid gridType="circle" stroke="var(--border)" opacity={0.3} />
            <RadialBar dataKey="visitors" cornerRadius={0} />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 pt-4 border-t border-border/40">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground">
          Delhi Hub leads efficiency <TrendingUp className="h-3 w-3 text-emerald-500" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 text-center">
          Showing volume index based on processed unit count
        </div>
      </CardFooter>
    </Card>
  );
}
