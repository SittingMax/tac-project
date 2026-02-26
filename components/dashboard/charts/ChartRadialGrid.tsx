"use client"

import { TrendingUp } from "lucide-react"
import { PolarGrid, RadialBar, RadialBarChart } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

export const description = "A radial chart with a grid"

const chartData = [
    { browser: "hubA", visitors: 4275, fill: "var(--color-hubA)" },
    { browser: "hubB", visitors: 3200, fill: "var(--color-hubB)" },
    { browser: "hubC", visitors: 2187, fill: "var(--color-hubC)" },
    { browser: "hubD", visitors: 1173, fill: "var(--color-hubD)" },
]

const chartConfig = {
    visitors: {
        label: "Throughput",
    },
    hubA: {
        label: "Delhi Hub",
        color: "var(--chart-1)",
    },
    hubB: {
        label: "Mumbai Hub",
        color: "var(--chart-2)",
    },
    hubC: {
        label: "Bengaluru Hub",
        color: "var(--chart-3)",
    },
    hubD: {
        label: "Chennai Hub",
        color: "var(--chart-4)",
    },
} satisfies ChartConfig

export function ChartRadialGrid() {
    return (
        <Card className="flex flex-col border-border bg-card shadow-sm h-full">
            <CardHeader className="items-center pb-0">
                <CardTitle>Hub Efficiency Index</CardTitle>
                <CardDescription>Relative throughput by major hubs</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <RadialBarChart data={chartData} innerRadius={30} outerRadius={100}>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel nameKey="browser" />}
                        />
                        <PolarGrid gridType="circle" />
                        <RadialBar dataKey="visitors" cornerRadius={10} />
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm pt-4">
                <div className="flex items-center gap-2 leading-none font-medium text-primary">
                    Delhi Hub leads efficiency <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none text-center">
                    Showing volume index based on processed unit count
                </div>
            </CardFooter>
        </Card>
    )
}
