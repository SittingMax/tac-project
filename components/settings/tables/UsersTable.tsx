'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrudTable } from '@/components/crud/CrudTable';
import { Users, Plus, MoreHorizontal, Edit2, Ban, KeyRound, Loader2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStaff, useToggleStaffStatus, Staff } from '@/hooks/useStaff';
import { useAuthStore } from '@/store/authStore';
import { hasRoleAccess } from '@/lib/access-control';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  WAREHOUSE_IMPHAL: 'Warehouse (Imphal)',
  WAREHOUSE_DELHI: 'Warehouse (Delhi)',
  WAREHOUSE_STAFF: 'Warehouse Staff',
  OPS: 'Operations',
  OPS_STAFF: 'Ops Staff',
  INVOICE: 'Invoice',
  FINANCE_STAFF: 'Finance',
  SUPPORT: 'Support',
};

function StaffActions({ staff, onToggle }: { staff: Staff; onToggle: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="p-0" >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal size={16} strokeWidth={1.5} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Edit2 size={16} strokeWidth={1.5} className="mr-2" />
          Edit User
        </DropdownMenuItem>
        <DropdownMenuItem>
          <KeyRound size={16} strokeWidth={1.5} className="mr-2" />
          Reset Password
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onToggle}>
          <Ban size={16} strokeWidth={1.5} className="mr-2" />
          {staff.is_active ? 'Disable Account' : 'Activate Account'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UsersTable() {
  const { data: staffList = [], isLoading } = useStaff();
  const toggleStatus = useToggleStaffStatus();
  const user = useAuthStore((s) => s.user);
  const canManage = hasRoleAccess(user?.role, ['ADMIN', 'MANAGER']);

  const columns: ColumnDef<Staff>[] = [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.full_name}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal text-xs bg-muted">
          {ROLE_LABELS[row.original.role] || row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'hub',
      header: 'Hub',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.hub?.code || '—'}</span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return (
          <Badge
            variant="default"
            className={
              isActive
                ? 'bg-status-success/10 text-status-success border-status-success/30 font-medium'
                : 'bg-muted text-muted-foreground border-border/50 font-medium'
            }
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <StaffActions
          staff={row.original}
          onToggle={() => {
            if (!canManage) {
              toast.error('You do not have permission to modify user status');
              return;
            }
            toggleStatus.mutate({
              id: row.original.id,
              isActive: row.original.is_active,
            });
          }}
        />
      ),
    },
  ];

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-row items-center justify-between border-b border-border/40 pb-4 flex flex-col gap-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Users size={20} strokeWidth={1.5} className="text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">System Users</CardTitle>
          </div>
          <CardDescription>Manage team access, roles, and permissions</CardDescription>
        </div>
        {canManage && (
          <Button size="sm" className="gap-2">
            <Plus size={16} strokeWidth={1.5} />
            Add User
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CrudTable
            columns={columns}
            data={staffList}
            pageSize={10}
            searchKey="full_name"
            searchPlaceholder="Search users by name or email..."
            className="p-6 border-0"
            emptyMessage="No team members found"
          />
        )}
      </CardContent>
    </Card>
  );
}
