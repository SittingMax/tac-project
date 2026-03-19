import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionCard } from './section-card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { IconButton } from '@/components/ui-core/feedback/icon-button';

const meta: Meta<typeof SectionCard> = {
  title: 'ui-core/layout/SectionCard',
  component: SectionCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SectionCard>;

export const Default: Story = {
  args: {
    title: 'Section Title',
    description: 'A brief description of this section.',
    children: <p className="text-muted-foreground text-sm">This is the section content.</p>,
  },
};

export const WithActions: Story = {
  args: {
    title: 'Customer Details',
    description: 'Manage customer information and preferences.',
    actions: (
      <>
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <IconButton variant="ghost" icon={MoreHorizontal} label="More actions" />
      </>
    ),
    children: (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground block mb-1">Company Root</span>
          <span className="font-medium">Acme Corp</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Contact Email</span>
          <span className="font-medium">contact@acme.com</span>
        </div>
      </div>
    ),
  },
};

export const WithoutHeader: Story = {
  args: {
    children: <p className="text-muted-foreground text-sm">A card without a header section.</p>,
  },
};
