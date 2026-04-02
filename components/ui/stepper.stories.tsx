import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stepper, Step } from './stepper';

const meta = {
  title: 'UI/Stepper',
  component: Stepper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    activeStep: 1,
    children: <></>, // Satisfy required children
  },
  render: (args) => (
    <div className="w-[800px] p-8 border">
      <Stepper {...args}>
        <Step title="Details" description="Basic info" />
        <Step title="Shipping" description="Address" />
        <Step title="Payment" description="Credit Card" />
      </Stepper>
    </div>
  ),
};

export const Vertical: Story = {
  args: {
    activeStep: 1,
    orientation: 'vertical',
    children: <></>, // Satisfy required children
  },
  render: (args) => (
    <div className="w-[400px] p-8 border">
      <Stepper {...args}>
        <Step title="Validation" description="Check order details" />
        <Step title="Fulfillment" description="Picking items" />
        <Step title="Dispatch" description="Handed to carrier" />
      </Stepper>
    </div>
  ),
};
