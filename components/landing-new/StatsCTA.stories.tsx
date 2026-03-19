import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatsCTA } from './stats-cta';

const meta = {
  title: 'Landing/StatsCTA',
  component: StatsCTA,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatsCTA>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
