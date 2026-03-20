import React, { useMemo, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  RadialBar,
  RadialBarChart,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../ui/chart';
import { ChartSkeleton } from '../../ui/skeleton';
import { useShipments } from '../../../hooks/useShipments';
import { TrendingUp } from 'lucide-react';
import { AppIcon } from '@/components/ui-core';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

type ChartType = 'radar' | 'area' | 'bar' | 'line' | 'pie' | 'radial';

interface HubAccumulator {
  label: string;
  volume: number;
  delivered: number;
  exceptions: number;
  totalWeight: number;
  express: number;
}

export const HubPerformanceChart: React.FC<{ isLoading?: boolean }> = ({
  isLoading: externalLoading,
}) => {
  const { data: shipments = [], isLoading: shipmentsLoading } = useShipments({ limit: 1000 });
  const isLoading = externalLoading || shipmentsLoading;
  const [chartType, setChartType] = useState<ChartType>('radar');

  const hubProfile = useMemo(() => {
    const hubs = new Map<string, HubAccumulator>();

    shipments.forEach((shipment) => {
      const hubCode = shipment.origin_hub?.code;
      if (!hubCode) {
        return;
      }

      const existing = hubs.get(hubCode) ?? {
        label: shipment.origin_hub?.name || hubCode,
        volume: 0,
        delivered: 0,
        exceptions: 0,
        totalWeight: 0,
        express: 0,
      };

      existing.volume += 1;
      existing.totalWeight += Number(shipment.total_weight ?? 0);

      if (shipment.status === 'DELIVERED') {
        existing.delivered += 1;
      }

      if (shipment.status === 'EXCEPTION') {
        existing.exceptions += 1;
      }

      if (shipment.service_level === 'EXPRESS') {
        existing.express += 1;
      }

      hubs.set(hubCode, existing);
    });

    const hubSummaries = Array.from(hubs.entries())
      .map(([code, summary]) => ({
        code,
        label: summary.label,
        volume: summary.volume,
        deliveredRate: summary.volume > 0 ? (summary.delivered / summary.volume) * 100 : 0,
        reliability: summary.volume > 0 ? 100 - (summary.exceptions / summary.volume) * 100 : 0,
        avgWeight: summary.volume > 0 ? summary.totalWeight / summary.volume : 0,
        expressMix: summary.volume > 0 ? (summary.express / summary.volume) * 100 : 0,
      }))
      .sort((a, b) => b.volume - a.volume);

    const primaryHub = hubSummaries[0] ?? {
      code: 'NA',
      label: 'No Hub Data',
      volume: 0,
      deliveredRate: 0,
      reliability: 0,
      avgWeight: 0,
      expressMix: 0,
    };
    const secondaryHub = hubSummaries[1] ?? {
      code: 'NA2',
      label: 'No Secondary Hub',
      volume: 0,
      deliveredRate: 0,
      reliability: 0,
      avgWeight: 0,
      expressMix: 0,
    };

    const normalize = (value: number, max: number) =>
      Math.min(100, Math.max(0, (value / (max === 0 ? 1 : max)) * 100));

    const maxVolume = Math.max(primaryHub.volume, secondaryHub.volume, 1);
    const maxAvgWeight = Math.max(primaryHub.avgWeight, secondaryHub.avgWeight, 1);

    const chartData = [
      {
        metric: 'Volume',
        hubA: normalize(primaryHub.volume, maxVolume),
        hubB: normalize(secondaryHub.volume, maxVolume),
      },
      {
        metric: 'Delivered',
        hubA: primaryHub.deliveredRate,
        hubB: secondaryHub.deliveredRate,
      },
      {
        metric: 'Reliability',
        hubA: primaryHub.reliability,
        hubB: secondaryHub.reliability,
      },
      {
        metric: 'Avg Weight',
        hubA: normalize(primaryHub.avgWeight, maxAvgWeight),
        hubB: normalize(secondaryHub.avgWeight, maxAvgWeight),
      },
      {
        metric: 'Express Mix',
        hubA: primaryHub.expressMix,
        hubB: secondaryHub.expressMix,
      },
    ];

    const cumulativeData = [
      {
        name: primaryHub.label,
        value: Math.round(chartData.reduce((acc, curr) => acc + curr.hubA, 0) / chartData.length),
        fill: 'var(--chart-1)',
      },
      {
        name: secondaryHub.label,
        value: Math.round(chartData.reduce((acc, curr) => acc + curr.hubB, 0) / chartData.length),
        fill: 'var(--chart-2)',
      },
    ];

    const chartConfig = {
      hubA: {
        label: primaryHub.label,
        color: 'var(--chart-1)',
      },
      hubB: {
        label: secondaryHub.label,
        color: 'var(--chart-2)',
      },
    } satisfies ChartConfig;

    return {
      chartConfig,
      chartData,
      cumulativeData,
      primaryHub,
      secondaryHub,
      hasHubData: hubSummaries.length > 0,
    };
  }, [shipments]);

  if (isLoading) return <ChartSkeleton height={400} />;

  if (!hubProfile.hasHubData) {
    return (
      <Card className="flex flex-col h-full border-border bg-card shadow-sm">
        <CardHeader className="items-center pb-0">
          <CardTitle>Hub Shipment Profile</CardTitle>
          <CardDescription>Comparative origin-hub metrics</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-0">
          <p className="text-sm text-muted-foreground py-12">No hub shipment data yet</p>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <AreaChart
            data={hubProfile.chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillHubA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-hubA)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-hubA)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillHubB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-hubB)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-hubB)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 4"
              stroke="var(--border)"
              opacity={0.2}
            />
            <XAxis
              dataKey="metric"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <ChartTooltip
              cursor={{
                stroke: 'hsl(var(--muted-foreground))',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="backdrop-blur-xl bg-background/80 border-border/50 shadow-xl rounded-xl"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="hubA"
              stroke="var(--color-hubA)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#fillHubA)"
            />
            <Area
              type="monotone"
              dataKey="hubB"
              stroke="var(--color-hubB)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#fillHubB)"
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart
            data={hubProfile.chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.3}
            />
            <XAxis
              dataKey="metric"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="hubA" fill="var(--color-hubA)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="hubB" fill="var(--color-hubB)" radius={[0, 0, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart
            data={hubProfile.chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.3}
            />
            <XAxis
              dataKey="metric"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              type="step"
              dataKey="hubA"
              stroke="var(--color-hubA)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="step"
              dataKey="hubB"
              stroke="var(--color-hubB)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="backdrop-blur-xl bg-background/80 border-border/50 shadow-xl rounded-xl"
                />
              }
            />
            <Pie
              data={hubProfile.cumulativeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              stroke="var(--background)"
              strokeWidth={0}
              paddingAngle={4}
            >
              {hubProfile.cumulativeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        );
      case 'radial':
        return (
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="30%"
            outerRadius="100%"
            barSize={15}
            data={hubProfile.cumulativeData}
            startAngle={90}
            endAngle={-270}
          >
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <RadialBar background dataKey="value" cornerRadius={0} />
          </RadialBarChart>
        );
      case 'radar':
      default:
        return (
          <RadarChart data={hubProfile.chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="metric" className="text-xs" />
            <PolarGrid stroke="var(--border)" opacity={0.3} />
            <Radar
              dataKey="hubA"
              fill="var(--color-hubA)"
              fillOpacity={0.1}
              stroke="var(--color-hubA)"
              strokeWidth={2}
              dot={{ r: 0, fillOpacity: 1 }}
            />
            <Radar
              dataKey="hubB"
              fill="var(--color-hubB)"
              fillOpacity={0.1}
              stroke="var(--color-hubB)"
              strokeWidth={2}
              dot={{ r: 0 }}
            />
          </RadarChart>
        );
    }
  };

  return (
    <Card className="flex flex-col h-full border border-border/50 bg-background shadow-none hover:bg-muted/5 transition-colors duration-300">
      <CardHeader className="flex flex-row items-start justify-between pb-4 border-b border-border/50 space-y-0">
        <div>
          <CardTitle className="text-xs text-muted-foreground">Hub Shipment Profile</CardTitle>
          <div className="text-lg font-semibold text-foreground mt-1">
            {hubProfile.primaryHub.label} vs {hubProfile.secondaryHub.label}
          </div>
        </div>
        <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
          <SelectTrigger className="w-[110px] h-8 text-xs border-border/50 bg-transparent shadow-none">
            <SelectValue placeholder="Chart Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="radar">Radar</SelectItem>
            <SelectItem value="area">Area</SelectItem>
            <SelectItem value="bar">Bar</SelectItem>
            <SelectItem value="line">Line</SelectItem>
            <SelectItem value="pie">Pie</SelectItem>
            <SelectItem value="radial">Radial</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pb-0 pt-6 flex-1 flex flex-col justify-center min-h-[300px]">
        <ChartContainer config={hubProfile.chartConfig} className="mx-auto w-full max-h-[300px]">
          {renderChart()}
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 pt-4 border-t border-border mt-4">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          {hubProfile.primaryHub.label} leading by shipment volume{' '}
          <AppIcon icon={TrendingUp} size={16} className="h-3 w-3 text-primary" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Based on current origin-hub shipment records
        </div>
      </CardFooter>
    </Card>
  );
};
