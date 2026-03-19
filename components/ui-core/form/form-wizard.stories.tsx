import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormWizard } from './form-wizard';

const meta = {
  title: 'UI-Core/Form/FormWizard',
  component: FormWizard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FormWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    steps: [
      {
        title: 'Account',
        description: 'Provide details',
        content: (
          <div className="text-sm text-muted-foreground p-4">
            Account form fields would go here...
          </div>
        ),
        isValid: true,
      },
      {
        title: 'Profile',
        description: 'Setup profile',
        content: (
          <div className="text-sm text-muted-foreground p-4">Profile configuration options...</div>
        ),
        isValid: true,
      },
      {
        title: 'Confirm',
        description: 'Review and save',
        content: (
          <div className="text-sm text-muted-foreground p-4">
            Review your information before submitting.
          </div>
        ),
        isValid: true,
      },
    ],
    onComplete: () => alert('Wizard completed!'),
  },
  render: (args) => (
    <div className="w-[800px]">
      <FormWizard {...args} />
    </div>
  ),
};
