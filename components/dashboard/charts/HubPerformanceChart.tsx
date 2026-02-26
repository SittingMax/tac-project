import React, { useMemo, useState } from 'react';
import {
    PolarAngleAxis, PolarGrid, Radar, RadarChart,
    Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis,
    Pie, PieChart, Cell, RadialBar, RadialBarChart
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
import { TrendingUp, BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon, Activity, Baseline, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

const chartConfig = {
    delhi: {
        label: 'Delhi Hub',
        color: 'var(--chart-1)',
    },
    imphal: {
        label: 'Imphal Hub',
        color: 'var(--chart-2)',
    },
} satisfies ChartConfig;

type ChartType = 'radar' | 'area' | 'bar' | 'line' | 'pie' | 'radial';

export const HubPerformanceChart: React.FC<{ isLoading?: boolean }> = ({
    isLoading: externalLoading,
}) => {
    const { data: shipments = [], isLoading: shipmentsLoading } = useShipments({ limit: 1000 });
    const isLoading = externalLoading || shipmentsLoading;
    const [chartType, setChartType] = useState<ChartType>('radar');

    const chartData = useMemo(() => {
        const metrics = {
            DEL: { Volume: 0, Speed: 0, Exceptions: 0, Revenue: 0 },
            IMF: { Volume: 0, Speed: 0, Exceptions: 0, Revenue: 0 }
        };

        shipments.forEach(s => {
            const code = s.origin_hub?.code;
            if (code === 'DEL' || code === 'IMF') {
                metrics[code].Volume += 1;
                metrics[code].Revenue += s.total_weight * 100;

                if (s.status === 'DELIVERED') metrics[code].Speed += 1;
                if (s.status === 'EXCEPTION') metrics[code].Exceptions += 1;
            }
        });

        const normalize = (val: number, max: number) => Math.min(100, Math.max(0, (val / (max === 0 ? 1 : max)) * 100));

        return [
            {
                metric: 'Volume',
                delhi: normalize(metrics.DEL.Volume, 100),
                imphal: normalize(metrics.IMF.Volume, 100),
            },
            {
                metric: 'Speed',
                delhi: normalize(metrics.DEL.Speed, 50),
                imphal: normalize(metrics.IMF.Speed, 50),
            },
            {
                metric: 'Reliability',
                delhi: 100 - normalize(metrics.DEL.Exceptions, 20),
                imphal: 100 - normalize(metrics.IMF.Exceptions, 20),
            },
            {
                metric: 'Revenue',
                delhi: normalize(metrics.DEL.Revenue, 50000),
                imphal: normalize(metrics.IMF.Revenue, 50000),
            },
            {
                metric: 'Efficiency',
                delhi: 85,
                imphal: 72,
            },
        ];
    }, [shipments]);

    // Data specifically formatted for single-variable charts (Pie/Radial) visualizing cumulative scores
    const cumulativeData = useMemo(() => {
        const totalDelhi = chartData.reduce((acc, curr) => acc + curr.delhi, 0) / chartData.length;
        const totalImphal = chartData.reduce((acc, curr) => acc + curr.imphal, 0) / chartData.length;
        return [
            { name: 'Delhi', value: Math.round(totalDelhi), fill: 'var(--chart-1)' },
            { name: 'Imphal', value: Math.round(totalImphal), fill: 'var(--chart-2)' }
        ];
    }, [chartData]);


    if (isLoading) return <ChartSkeleton height={400} />;

    if (shipments.length === 0) {
        return (
            <Card className="flex flex-col h-full border-border bg-card shadow-sm">
                <CardHeader className="items-center pb-0">
                    <CardTitle>Hub Performance Profile</CardTitle>
                    <CardDescription>Comparative operational metrics</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 items-center justify-center pb-0">
                    <p className="text-sm text-muted-foreground py-12">No data yet</p>
                </CardContent>
            </Card>
        );
    }

    const renderChart = () => {
        switch (chartType) {
            case 'area':
                return (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="fillDelhi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-delhi)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-delhi)" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="fillImphal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-imphal)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-imphal)" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="metric" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        <Area type="monotone" dataKey="delhi" stroke="var(--color-delhi)" fillOpacity={1} fill="url(#fillDelhi)" />
                        <Area type="monotone" dataKey="imphal" stroke="var(--color-imphal)" fillOpacity={1} fill="url(#fillImphal)" />
                    </AreaChart>
                );
            case 'bar':
                return (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="metric" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                        <Bar dataKey="delhi" fill="var(--color-delhi)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="imphal" fill="var(--color-imphal)" radius={[0, 0, 0, 0]} />
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="metric" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="delhi" stroke="var(--color-delhi)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="imphal" stroke="var(--color-imphal)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie
                            data={cumulativeData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            stroke="var(--background)"
                            strokeWidth={2}
                            paddingAngle={2}
                        >
                            {cumulativeData.map((entry, index) => (
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
                        data={cumulativeData}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={0}
                        />
                    </RadialBarChart>
                );
            case 'radar':
            default:
                return (
                    <RadarChart data={chartData}>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarAngleAxis dataKey="metric" className="text-xs" />
                        <PolarGrid stroke="var(--border)" opacity={0.5} />
                        <Radar
                            dataKey="delhi"
                            fill="var(--color-delhi)"
                            fillOpacity={0.6}
                            stroke="var(--color-delhi)"
                            strokeWidth={2}
                            dot={{ r: 4, fillOpacity: 1 }}
                        />
                        <Radar
                            dataKey="imphal"
                            fill="var(--color-imphal)"
                            fillOpacity={0.6}
                            stroke="var(--color-imphal)"
                            strokeWidth={2}
                        />
                    </RadarChart>
                );
        }
    };

    return (
        <Card className="flex flex-col h-full border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-4 border-b space-y-0">
                <div>
                    <CardTitle className="text-base">Hub Performance Profile</CardTitle>
                    <CardDescription className="text-xs mt-1">
                        Comparative metrics between Delhi & Imphal
                    </CardDescription>
                </div>
                <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs border-border bg-muted/20">
                        <SelectValue placeholder="Chart Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="radar"><div className="flex items-center gap-2"><Target className="w-3 h-3" /> Radar</div></SelectItem>
                        <SelectItem value="area"><div className="flex items-center gap-2"><Baseline className="w-3 h-3" /> Area</div></SelectItem>
                        <SelectItem value="bar"><div className="flex items-center gap-2"><BarChart2 className="w-3 h-3" /> Bar</div></SelectItem>
                        <SelectItem value="line"><div className="flex items-center gap-2"><LineChartIcon className="w-3 h-3" /> Line</div></SelectItem>
                        <SelectItem value="pie"><div className="flex items-center gap-2"><PieChartIcon className="w-3 h-3" /> Pie</div></SelectItem>
                        <SelectItem value="radial"><div className="flex items-center gap-2"><Activity className="w-3 h-3" /> Radial</div></SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="pb-0 pt-6 flex-1 flex flex-col justify-center min-h-[300px]">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto w-full max-h-[300px]"
                >
                    {renderChart()}
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm pt-4 border-t mt-4">
                <div className="flex items-center gap-2 font-medium leading-none">
                    Delhi showing +5.2% efficiency <TrendingUp className="h-4 w-4 text-status-success" />
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                    January - June 2024 Profile
                </div>
            </CardFooter>
        </Card>
    );
};

