import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContactSection } from './contact-section';

const meta = {
  title: 'Landing/ContactSection',
  component: ContactSection,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContactSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
