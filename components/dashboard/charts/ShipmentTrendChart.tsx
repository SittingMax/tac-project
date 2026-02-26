import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { ChartSkeleton } from '../../ui/skeleton';
import { useShipments } from '../../../hooks/useShipments';

const chartConfig = {
  inbound: {
    label: 'Inbound',
    color: 'var(--chart-1)',
  },
  outbound: {
    label: 'Outbound',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export const ShipmentTrendChart: React.FC<{ isLoading?: boolean }> = ({
  isLoading: externalLoading,
}) => {
  const [timeRange, setTimeRange] = useState('90d');
  const { data: shipments = [], isLoading: shipmentsLoading } = useShipments({ limit: 1000 });

  const isLoading = externalLoading || shipmentsLoading;

  const trendChartData = useMemo(() => {
    // Generate base data array for 90 days to allow filtering down
    const days = 90;
    const dateMap = new Map<string, { inbound: number; outbound: number }>();

    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd');
      dateMap.set(date, { inbound: 0, outbound: 0 });
    }

    shipments.forEach((shipment) => {
      const createdDate = format(startOfDay(new Date(shipment.created_at)), 'yyyy-MM-dd');
      const existing = dateMap.get(createdDate);
      if (existing) {
        if (shipment.origin_hub?.code === 'IMF') {
          existing.outbound += 1;
        } else if (shipment.destination_hub?.code === 'IMF') {
          existing.inbound += 1;
        }
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shipments]);

  const filteredData = useMemo(() => {
    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }
    const referenceDate = new Date();
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return trendChartData.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [trendChartData, timeRange]);

  if (isLoading) return <ChartSkeleton />;

  return (
    <Card className="pt-0 h-full flex flex-col border-border bg-card shadow-sm">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Shipment Volume Trend</CardTitle>
          <CardDescription>
            Showing inbound vs outbound shipments
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-none sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="90d" className="rounded-none">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-none">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-none">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1">
        {trendChartData.every((d) => d.inbound === 0 && d.outbound === 0) ? (
          <div className="flex items-center justify-center py-12 h-full">
            <div className="text-center">
              <p className="text-muted-foreground">No shipments for selected period</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create shipments to see volume trends
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-outbound)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-outbound)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-inbound)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-inbound)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="inbound"
                type="natural"
                fill="url(#fillInbound)"
                stroke="var(--color-inbound)"
                stackId="a"
              />
              <Area
                dataKey="outbound"
                type="natural"
                fill="url(#fillOutbound)"
                stroke="var(--color-outbound)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
