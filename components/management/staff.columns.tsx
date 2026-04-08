'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CrudRowActions } from '@/components/crud/CrudRowActions';
import { StatusBadge, type StatusVariant } from '@/components/domain/status-badge';
import { User as UserIcon, Check, X } from 'lucide-react';
import { IconButton } from '@/components/ui-core/feedback/icon-button';
import { Staff } from '@/hooks/useStaff';

// Role color mapping using semantic badge classes
const ROLE_COLORS: Record<string, StatusVariant> = {
  SUPER_ADMIN: 'PRIMARY',
  ADMIN: 'PRIMARY',
  MANAGER: 'PICKED_UP',
  OPS: 'CREATED',
  OPS_STAFF: 'CREATED',
  WAREHOUSE_IMPHAL: 'IN_TRANSIT',
  WAREHOUSE_DELHI: 'IN_TRANSIT',
  WAREHOUSE_STAFF: 'IN_TRANSIT',
  INVOICE: 'DELIVERED',
  FINANCE_STAFF: 'DELIVERED',
  SUPPORT: 'CANCELLED',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  OPS: 'Operations (Legacy)',
  OPS_STAFF: 'Operations Staff',
  WAREHOUSE_IMPHAL: 'Warehouse (Imphal)',
  WAREHOUSE_DELHI: 'Warehouse (Delhi)',
  WAREHOUSE_STAFF: 'Warehouse Staff',
  INVOICE: 'Finance (Legacy)',
  FINANCE_STAFF: 'Finance Staff',
  SUPPORT: 'Support',
};

export interface StaffColumnsParams {
  onEdit: (row: Staff) => void;
  onToggleStatus: (row: Staff) => void;
  onDelete: (row: Staff) => void;
}

/**
 * Generate column definitions for the staff table.
 * Includes callbacks for edit, status toggle, and delete actions.
 */
export function getStaffColumns(params: StaffColumnsParams): ColumnDef<Staff>[] {
  return [
    {
      accessorKey: 'full_name',
      header: 'Staff Member',
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center border border-white/10">
            <UserIcon size={16} strokeWidth={1.5} className="text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium text-foreground">{row.original.full_name}</div>
            <div className="text-xs text-muted-foreground">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <StatusBadge status={ROLE_COLORS[row.original.role] || 'NEUTRAL'} className="font-bold">
          {ROLE_LABELS[row.original.role] || row.original.role.replace(/_/g, ' ')}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'hub',
      header: 'Hub',
      cell: ({ row }) =>
        row.original.hub ? (
          <span className="text-xs font-mono">{row.original.hub.code}</span>
        ) : (
          <span className="text-xs text-muted-foreground">HQ / Global</span>
        ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`flex items-center gap-1.5 text-xs ${
            row.original.is_active ? 'text-status-active' : 'text-muted-foreground'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.original.is_active ? 'bg-status-active' : 'bg-muted'
            }`}
          />
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IconButton
            variant={row.original.is_active ? 'ghost' : 'secondary'}
            label={row.original.is_active ? 'Deactivate' : 'Activate'}
            icon={row.original.is_active ? X : Check}
            onClick={() => params.onToggleStatus(row.original)}
            className={row.original.is_active ? 'text-destructive hover:text-destructive/80' : ''}
          />
          <CrudRowActions
            onEdit={() => params.onEdit(row.original)}
            onDelete={() => params.onDelete(row.original)}
          />
        </div>
      ),
    },
  ];
}
