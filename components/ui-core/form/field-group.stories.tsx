import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldGroup } from './field-group';

const meta: Meta<typeof FieldGroup> = {
  title: 'ui-core/form/FieldGroup',
  component: FieldGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Wraps a label + control + hint/error in a consistent vertical stack for manual (non-RHF) forms. For React Hook Form, use `FormField > FormItem > FormLabel + FormControl + FormMessage` instead.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FieldGroup>;

export const Default: Story = {
  render: () => (
    <FieldGroup label="CN Number" htmlFor="cn">
      <Input id="cn" className="h-8 px-3 text-sm" placeholder="TAC-24-001234" />
    </FieldGroup>
  ),
};

export const Required: Story = {
  render: () => (
    <FieldGroup label="Consignee Name" htmlFor="consignee" required>
      <Input id="consignee" className="h-8 px-3 text-sm" placeholder="John Doe" />
    </FieldGroup>
  ),
};

export const WithHint: Story = {
  render: () => (
    <FieldGroup label="Vehicle Number" htmlFor="vehicle" hint="Format: MN01AB1234">
      <Input id="vehicle" className="h-8 px-3 text-sm" placeholder="MN01AB1234" />
    </FieldGroup>
  ),
};

export const WithError: Story = {
  render: () => (
    <FieldGroup label="AWB Number" htmlFor="awb" error="CN number is required">
      <Input id="awb" className="h-8 px-3 text-sm border-destructive" placeholder="TAC-24-001234" />
    </FieldGroup>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <FieldGroup label="Exception Description" htmlFor="description" required hint="Minimum 5 characters">
      <Textarea id="description" className="min-h-[80px] text-sm" placeholder="Details of the issue..." rows={3} />
    </FieldGroup>
  ),
};

export const RequiredWithError: Story = {
  name: 'Required + Error',
  render: () => (
    <FieldGroup label="Description" htmlFor="desc" required error="This field is required">
      <Textarea id="desc" className="min-h-[80px] text-sm border-destructive" rows={3} />
    </FieldGroup>
  ),
};
