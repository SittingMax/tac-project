import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlobalFleet } from './global-fleet';

const meta = {
  title: 'Landing/GlobalFleet',
  component: GlobalFleet,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GlobalFleet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
