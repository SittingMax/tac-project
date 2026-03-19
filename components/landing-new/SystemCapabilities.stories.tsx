import type { Meta, StoryObj } from '@storybook/react-vite';
import { SystemCapabilities } from './system-capabilities';

const meta = {
  title: 'Landing/SystemCapabilities',
  component: SystemCapabilities,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SystemCapabilities>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
