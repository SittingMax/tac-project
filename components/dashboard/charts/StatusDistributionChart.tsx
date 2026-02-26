import React, { useMemo } from 'react';
import { Label, Pie, PieChart, Sector } from 'recharts';
import { type PieSectorDataItem } from 'recharts/types/polar/Pie';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  ChartContainer,
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
  count: {
    label: 'Shipments',
  },
  inTransit: {
    label: 'In Transit',
    color: 'var(--chart-1)',
  },
  delivered: {
    label: 'Delivered',
    color: 'var(--chart-2)',
  },
  pending: {
    label: 'Pending',
    color: 'var(--chart-3)',
  },
  exception: {
    label: 'Exception',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

export const StatusDistributionChart: React.FC<{ isLoading?: boolean }> = ({
  isLoading: externalLoading,
}) => {
  const { data: shipments = [], isLoading: shipmentsLoading } = useShipments({ limit: 1000 });
  const isLoading = externalLoading || shipmentsLoading;

  const statusChartData = useMemo(() => {
    const inTransit = shipments.filter((s) =>
      ['RECEIVED_AT_ORIGIN', 'IN_TRANSIT', 'RECEIVED_AT_DEST'].includes(s.status)
    ).length;
    const delivered = shipments.filter((s) => s.status === 'DELIVERED').length;
    const pending = shipments.filter((s) =>
      ['CREATED', 'PICKUP_SCHEDULED', 'PICKED_UP'].includes(s.status)
    ).length;
    const exception = shipments.filter((s) => s.status === 'EXCEPTION').length;

    return [
      { status: 'inTransit', count: inTransit, fill: 'var(--color-inTransit)' },
      { status: 'delivered', count: delivered, fill: 'var(--color-delivered)' },
      { status: 'pending', count: pending, fill: 'var(--color-pending)' },
      { status: 'exception', count: exception, fill: 'var(--color-exception)' },
    ].filter((item) => item.count > 0);
  }, [shipments]);

  const [activeStatus, setActiveStatus] = React.useState<string>(
    statusChartData[0]?.status || 'pending'
  );

  // Sync active status if data changes and current active status is no longer in data
  React.useEffect(() => {
    if (statusChartData.length > 0 && !statusChartData.find((d) => d.status === activeStatus)) {
      setActiveStatus(statusChartData[0].status);
    }
  }, [statusChartData, activeStatus]);

  const activeIndex = React.useMemo(
    () => statusChartData.findIndex((item) => item.status === activeStatus),
    [activeStatus, statusChartData]
  );
  const statuses = React.useMemo(() => statusChartData.map((item) => item.status), [statusChartData]);

  if (isLoading) return <ChartSkeleton />;

  const id = 'status-distribution-pie';

  if (statusChartData.length === 0) {
    return (
      <Card className="flex flex-col h-full border-border bg-card shadow-sm">
        <CardHeader className="flex-row items-start space-y-0 pb-0">
          <div className="grid gap-1">
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current shipment breakdown</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-0">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No shipments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first shipment to see statuses
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-chart={id} className="flex flex-col h-full border-border bg-card shadow-sm">
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>Current shipment breakdown</CardDescription>
        </div>
        <Select value={activeStatus} onValueChange={setActiveStatus}>
          <SelectTrigger
            className="ml-auto h-7 w-[130px] rounded-none pl-2.5"
            aria-label="Select a status"
          >
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-none">
            {statuses.map((key) => {
              const config = chartConfig[key as keyof typeof chartConfig];
              if (!config) return null;

              return (
                <SelectItem key={key} value={key} className="rounded-none [&_span]:flex">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-none"
                      style={{
                        backgroundColor: `var(--color-${key})`,
                      }}
                    />
                    {config?.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[280px]"
        >
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={statusChartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex !== -1 ? activeIndex : undefined}
              activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector {...props} outerRadius={outerRadius + 25} innerRadius={outerRadius + 12} />
                </g>
              )}
            >
              {activeIndex !== -1 && statusChartData[activeIndex] && (
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
                            className="fill-foreground text-3xl font-bold"
                          >
                            {statusChartData[activeIndex].count.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-xs"
                          >
                            {chartConfig[activeStatus as keyof typeof chartConfig]?.label || 'Shipments'}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              )}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
