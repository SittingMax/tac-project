'use client';

import { Bar, BarChart, XAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

export const description = 'A stacked bar chart with a legend';
export const iframeHeight = '600px';
export const containerClassName =
  '[&>div]:w-full [&>div]:max-w-md flex items-center justify-center min-h-svh';

const chartData = [
  { date: '2024-07-15', running: 450, swimming: 300 },
  { date: '2024-07-16', running: 380, swimming: 420 },
  { date: '2024-07-17', running: 520, swimming: 120 },
  { date: '2024-07-18', running: 140, swimming: 550 },
  { date: '2024-07-19', running: 600, swimming: 350 },
  { date: '2024-07-20', running: 480, swimming: 400 },
];

const chartConfig = {
  running: {
    label: 'Active Fleet',
    color: 'var(--chart-1)',
  },
  swimming: {
    label: 'Idle Fleet',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function ChartTooltipDefault() {
  return (
    <Card className="flex flex-col h-full rounded-none border border-border/40 bg-transparent shadow-none hover:bg-muted/5 transition-colors duration-300 w-full">
      <CardHeader className="pb-4 border-b border-border/40 space-y-0">
        <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
          Current Fleet Status
        </CardTitle>
        <div className="text-xl font-bold tracking-tighter text-foreground mt-1">
          Active vs Idle Composition
        </div>
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
            <Bar dataKey="running" stackId="a" fill="var(--color-running)" radius={0} />
            <Bar dataKey="swimming" stackId="a" fill="var(--color-swimming)" radius={0} />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} defaultIndex={1} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
