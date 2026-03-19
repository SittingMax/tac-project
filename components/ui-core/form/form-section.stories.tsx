import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormSection } from './form-section';
import { Truck, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const meta: Meta<typeof FormSection> = {
  title: 'ui-core/form/FormSection',
  component: FormSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof FormSection>;

export const Default: Story = {
  args: {
    title: 'Basic Information',
    description: 'Enter the primary details for this record.',
    icon: Truck,
    children: (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Reference Number</Label>
          <Input placeholder="Enter reference..." />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" />
        </div>
      </div>
    ),
  },
};

export const WithoutIconOrDescription: Story = {
  args: {
    title: 'Destination',
    children: (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Full Address</Label>
          <Input placeholder="123 Origin St" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>City</Label>
            <Input placeholder="Noida" />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input placeholder="UP" />
          </div>
        </div>
      </div>
    ),
  },
};

export const WithAction: Story = {
  args: {
    title: 'Location Details',
    description: 'Provide pickup and delivery points.',
    icon: MapPin,
    action: <button className="text-sm text-primary hover:underline font-medium">Use Saved Address</button>,
    children: (
      <div className="h-20 flex items-center justify-center border border-dashed border-border rounded-md bg-muted/20">
        <p className="text-sm text-muted-foreground">Form fields here</p>
      </div>
    ),
  },
};
