import React, { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { format, startOfDay, subDays } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../ui/chart';
import { ChartSkeleton } from '../../ui/skeleton';
import { useShipments } from '../../../hooks/useShipments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--chart-1)',
  },
  cost: {
    label: 'Operational Cost',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

export const RevenueTrendChart: React.FC<{ isLoading?: boolean }> = ({
  isLoading: externalLoading,
}) => {
  const { data: shipments = [], isLoading: shipmentsLoading } = useShipments({ limit: 1000 });
  const [timeRange, setTimeRange] = useState('30d');

  const isLoading = externalLoading || shipmentsLoading;

  const chartData = useMemo(() => {
    let days = 30;
    if (timeRange === '90d') days = 90;
    if (timeRange === '7d') days = 7;

    const dateMap = new Map<string, { revenue: number; cost: number }>();

    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd');
      dateMap.set(date, { revenue: 0, cost: 0 });
    }

    shipments.forEach((shipment) => {
      const createdDate = format(startOfDay(new Date(shipment.created_at)), 'yyyy-MM-dd');
      const existing = dateMap.get(createdDate);

      if (existing) {
        // Mock revenue/cost based on weight if real financials aren't available
        // In a real app, this would use the `financials` table
        const baseRev = shipment.total_weight * 150; // 150 INR per kg
        const baseCost = shipment.total_weight * 90; // 90 INR cost per kg

        // Add some random fuzziness based on service level
        const multiplier = shipment.service_level === 'EXPRESS' ? 1.5 : 1;

        existing.revenue += baseRev * multiplier;
        existing.cost += baseCost * multiplier;
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shipments, timeRange]);

  if (isLoading) return <ChartSkeleton height={300} />;

  if (chartData.every((d) => d.revenue === 0)) {
    return (
      <Card className="flex flex-col h-full border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>Revenue & Costs</CardTitle>
            <CardDescription>Daily financial performance</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No financial data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals for the header metrics
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCost = chartData.reduce((sum, item) => sum + item.cost, 0);

  return (
    <Card className="flex flex-col h-full border-border bg-card shadow-sm">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="flex justify-between items-center">
            <span>Revenue & Costs</span>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[130px] h-8 text-xs rounded-none">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="90d" className="rounded-none text-xs">
                  Last 90 days
                </SelectItem>
                <SelectItem value="30d" className="rounded-none text-xs">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-none text-xs">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
          <CardDescription>Daily financial performance</CardDescription>
        </div>
        <div className="flex">
          <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left sm:border-t-0 sm:border-l sm:px-8 sm:py-6 relative z-30">
            <span className="text-xs text-muted-foreground">{chartConfig.revenue.label}</span>
            <span className="text-lg font-bold leading-none sm:text-2xl">
              ₹{(totalRevenue / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 border-t border-l px-6 py-4 text-left sm:border-t-0 sm:px-8 sm:py-6 relative z-30">
            <span className="text-xs text-muted-foreground">{chartConfig.cost.label}</span>
            <span className="text-lg font-bold leading-none sm:text-2xl">
              ₹{(totalCost / 1000).toFixed(1)}k
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 flex-1">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="cost"
              type="monotone"
              stroke="var(--color-cost)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
