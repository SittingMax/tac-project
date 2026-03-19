import type { Meta, StoryObj } from '@storybook/react-vite';
import HeroFinal from './hero-final';
import { MemoryRouter } from 'react-router-dom';

const meta = {
  title: 'Landing/Hero',
  component: HeroFinal,
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
} satisfies Meta<typeof HeroFinal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
