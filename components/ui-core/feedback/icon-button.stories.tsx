import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Archive,
  Trash2,
  Eye,
  Edit,
  Download,
  Copy,
  Star,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { IconButton } from './icon-button';

const meta: Meta<typeof IconButton> = {
  title: 'ui-core/feedback/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible icon-only button that enforces a mandatory `label` prop mapped to `aria-label` and `title`. Eliminates the anti-pattern of icon buttons missing screen reader text.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['ghost', 'outline', 'secondary', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: {
    label: 'Archive item',
    icon: Archive,
  },
};

export const Outline: Story = {
  args: {
    label: 'Download file',
    icon: Download,
    variant: 'outline',
  },
};

export const Destructive: Story = {
  args: {
    label: 'Delete item',
    icon: Trash2,
    variant: 'destructive',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Edit (disabled)',
    icon: Edit,
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton label="View" icon={Eye} variant="ghost" />
      <IconButton label="Edit" icon={Edit} variant="outline" />
      <IconButton label="Copy" icon={Copy} variant="secondary" />
      <IconButton label="Delete" icon={Trash2} variant="destructive" />
      <IconButton label="Print" icon={Printer} variant="ghost" />
      <IconButton label="Refresh" icon={RefreshCw} variant="outline" />
      <IconButton label="Star" icon={Star} variant="ghost" />
    </div>
  ),
};

export const TableActionRow: Story = {
  render: () => (
    <div className="flex items-center gap-1">
      <IconButton label="View shipment" icon={Eye} variant="ghost" size="sm" />
      <IconButton label="Edit shipment" icon={Edit} variant="ghost" size="sm" />
      <IconButton label="Archive shipment" icon={Archive} variant="ghost" size="sm" />
      <IconButton label="Delete shipment" icon={Trash2} variant="ghost" size="sm" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Standard table action column pattern. Each button has a unique aria-label for screen readers.',
      },
    },
  },
};
