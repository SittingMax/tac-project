import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatCard } from './stat-card';
import { Package, Truck, AlertTriangle, CheckCircle } from 'lucide-react';

const meta: Meta<typeof StatCard> = {
  title: 'ui-core/data/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    title: 'Total Shipments',
    value: '1,245',
    icon: Package,
    iconColor: 'primary',
  },
};

export const WithTrendUp: Story = {
  args: {
    title: 'Revenue (Monthly)',
    value: '$45,231',
    icon: CheckCircle,
    iconColor: 'success',
    trend: {
      direction: 'up',
      value: '12%',
      label: 'vs last month',
    },
  },
};

export const WithTrendDown: Story = {
  args: {
    title: 'Delayed Shipments',
    value: '23',
    icon: AlertTriangle,
    iconColor: 'error',
    trend: {
      direction: 'down',
      value: '4%',
      label: 'vs yesterday',
    },
  },
};

export const WarningState: Story = {
  args: {
    title: 'Pending Approvals',
    value: '4',
    subtitle: 'Requires immediate action',
    icon: Truck,
    iconColor: 'warning',
  },
};

export const GridExample: Story = {
  decorators: [
    () => (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-4xl">
        <StatCard title="Total" value="1,245" icon={Package} iconColor="primary" />
        <StatCard title="Delivered" value="982" icon={CheckCircle} iconColor="success" />
        <StatCard title="In Transit" value="240" icon={Truck} iconColor="warning" />
        <StatCard title="Exceptions" value="23" icon={AlertTriangle} iconColor="error" />
      </div>
    ),
  ],
};
