import type { Meta, StoryObj } from '@storybook/react-vite';
import { CrudTable } from './CrudTable';

const meta = {
  title: 'CRUD/CrudTable',
  component: CrudTable,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof CrudTable>;

export default meta;
type Story = StoryObj<typeof meta>;

type Invoice = {
  id: string;
  status: string;
  amount: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns: any[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'amount', header: 'Amount' },
];

const data: Invoice[] = [
  { id: 'INV-001', status: 'Pending', amount: '$250.00' },
  { id: 'INV-002', status: 'Paid', amount: '$150.00' },
  { id: 'INV-003', status: 'Failed', amount: '$350.00' },
  { id: 'INV-004', status: 'Paid', amount: '$850.00' },
  { id: 'INV-005', status: 'Pending', amount: '$120.00' },
];

export const DataDense: Story = {
  args: {
    columns,
    data,
    searchKey: 'id',
    enableRowSelection: true,
  },
  render: (args) => (
    <div className="w-full">
      <CrudTable {...args} />
    </div>
  ),
};
