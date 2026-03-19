import type { Meta, StoryObj } from '@storybook/react-vite';
import { OrganizationCard } from './OrganizationCard';

const meta = {
  title: 'Settings/Cards/OrganizationCard',
  component: OrganizationCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OrganizationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
