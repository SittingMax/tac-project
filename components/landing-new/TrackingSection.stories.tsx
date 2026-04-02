import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrackingSection } from './tracking-section';
import { MemoryRouter } from 'react-router-dom';

const meta = {
  title: 'Landing/TrackingSection',
  component: TrackingSection,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof TrackingSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
