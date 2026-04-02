import type { Meta, StoryObj } from '@storybook/react-vite';
import { Navbar } from './navbar';
import { MemoryRouter } from 'react-router-dom';

const meta = {
  title: 'Landing/Navbar',
  component: Navbar,
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
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Scrolled: Story = {
  parameters: {
    chromatic: { delay: 500 },
  },
};
