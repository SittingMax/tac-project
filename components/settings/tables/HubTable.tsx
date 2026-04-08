import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrudTable } from '@/components/crud/CrudTable';
import { Network, Plus, MoreHorizontal, Edit2, Ban, Eye } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HUBS } from '@/lib/constants';

const columns: ColumnDef<(typeof HUBS)[keyof typeof HUBS]>[] = [
  {
    accessorKey: 'name',
    header: 'Hub Name',
    cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.name}</span>,
  },
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.original.code}
      </Badge>
    ),
  },
  {
    accessorKey: 'sortCode',
    header: 'Sort Code',
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-sm">{row.original.sortCode}</span>
    ),
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground truncate max-w-[250px] inline-block">
        {row.original.address}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: () => (
      <Badge
        variant="default"
        className="bg-status-success/10 text-status-success border-status-success/30 font-medium"
      >
        Active
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="p-0" >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Eye size={16} strokeWidth={1.5} className="mr-2" />
            View Detail
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit2 size={16} strokeWidth={1.5} className="mr-2" />
            Edit Configuration
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <Ban size={16} strokeWidth={1.5} className="mr-2" />
            Disable Hub
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function HubTable() {
  const data = Object.values(HUBS);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-row items-center justify-between border-b border-border/40 pb-4 flex flex-col gap-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Network size={20} strokeWidth={1.5} className="text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">Hub Network</CardTitle>
          </div>
          <CardDescription>Manage regional distribution centers and transit hubs</CardDescription>
        </div>
        <Button size="sm" className="gap-2">
          <Plus size={16} strokeWidth={1.5} />
          Add Hub
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <CrudTable
          columns={columns}
          data={data}
          pageSize={10}
          searchKey="name"
          searchPlaceholder="Search hubs..."
          className="p-6 border-0"
        />
      </CardContent>
    </Card>
  );
}
