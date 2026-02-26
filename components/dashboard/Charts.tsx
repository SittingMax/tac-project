import React from 'react';
import { ShipmentTrendChart } from './charts/ShipmentTrendChart';
import { StatusDistributionChart } from './charts/StatusDistributionChart';
import { ChartTooltipDefault } from './charts/ChartTooltipDefault';
import { ChartPieDonutText } from './charts/ChartPieDonutText';
import { RevenueTrendChart } from './charts/RevenueTrendChart';
import { HubPerformanceChart } from './charts/HubPerformanceChart';

export const DashboardCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Trend Chart (1 column) */}
      <div className="col-span-1 h-full">
        <ShipmentTrendChart />
      </div>

      {/* Status Distribution (1 column) */}
      <div className="col-span-1 h-full">
        <StatusDistributionChart />
      </div>

      {/* Fleet Status (1 column) */}
      <div className="col-span-1 h-full">
        <ChartTooltipDefault />
      </div>

      {/* Financial Trends (Line) - 1 col */}
      <div className="col-span-1 h-full">
        <RevenueTrendChart />
      </div>

      {/* Hub Performance (Radar) - 1 col */}
      <div className="col-span-1 h-full">
        <HubPerformanceChart />
      </div>

      {/* Transport Modes (Radial) - 1 col */}
      <div className="col-span-1 h-full">
        <ChartPieDonutText />
      </div>

    </div>
  );
};

export default DashboardCharts;
