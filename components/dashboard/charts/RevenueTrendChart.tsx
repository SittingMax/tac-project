import React, { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { format, startOfDay, subDays } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../ui/chart';
import { ChartSkeleton } from '../../ui/skeleton';
import { useInvoices } from '../../../hooks/useInvoices';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

const chartConfig = {
  issued: {
    label: 'Issued Total',
    color: 'var(--chart-1)',
  },
  paid: {
    label: 'Paid Total',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

export const RevenueTrendChart: React.FC<{ isLoading?: boolean }> = ({
  isLoading: externalLoading,
}) => {
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const [timeRange, setTimeRange] = useState('30d');
  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>('issued');

  const isLoading = externalLoading || invoicesLoading;

  const chartData = useMemo(() => {
    let days = 30;
    if (timeRange === '90d') days = 90;
    if (timeRange === '7d') days = 7;

    const dateMap = new Map<string, { issued: number; paid: number }>();

    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd');
      dateMap.set(date, { issued: 0, paid: 0 });
    }

    invoices.forEach((invoice) => {
      const issueSource = invoice.issue_date || invoice.created_at;
      if (issueSource) {
        const issueDate = format(startOfDay(new Date(issueSource)), 'yyyy-MM-dd');
        const existingIssueDay = dateMap.get(issueDate);
        if (existingIssueDay) {
          existingIssueDay.issued += Number(invoice.total || 0);
        }
      }

      if (invoice.paid_at) {
        const paidDate = format(startOfDay(new Date(invoice.paid_at)), 'yyyy-MM-dd');
        const existingPaidDay = dateMap.get(paidDate);
        if (existingPaidDay) {
          existingPaidDay.paid += Number(invoice.total || 0);
        }
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [invoices, timeRange]);

  if (isLoading) return <ChartSkeleton height={250} />;

  if (chartData.every((d) => d.issued === 0 && d.paid === 0)) {
    return (
      <Card className="flex flex-col h-full border border-border/40 bg-card shadow-sm hover:bg-muted/5 transition-colors duration-300">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-border/40 p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 sm:py-6">
            <CardTitle className="text-xs text-muted-foreground">Invoice Totals</CardTitle>
            <div className="text-lg font-semibold text-foreground">Billing Activity</div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No invoice data available</p>
        </CardContent>
      </Card>
    );
  }

  const totals = {
    issued: chartData.reduce((sum, item) => sum + item.issued, 0),
    paid: chartData.reduce((sum, item) => sum + item.paid, 0),
  };

  return (
    <Card className="flex flex-col h-full border border-border/40 bg-card shadow-sm py-0 p-0">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-border/40 p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-6">
          <CardTitle className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Invoice Totals</span>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] h-8 text-xs border-border/40 bg-transparent shadow-none">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
          <div className="text-lg font-semibold text-foreground">Finance Overview</div>
        </div>
        <div className="flex">
          {(['issued', 'paid'] as const).map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-border/40 px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6 transition-colors"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-xl font-semibold sm:text-3xl text-foreground">
                  ₹{(totals[key] / 1000).toFixed(1)}k
                </span>
              </button>
            );
          })}
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
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 4"
              stroke="var(--border)"
              opacity={0.2}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip 
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} 
              content={
                <ChartTooltipContent 
                  className="w-[150px] backdrop-blur-xl bg-background/80 border-border/50 shadow-xl rounded-xl"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              } 
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
