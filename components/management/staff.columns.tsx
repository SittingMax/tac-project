'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CrudRowActions } from '@/components/crud/CrudRowActions';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Staff } from '@/hooks/useStaff';

// Role color mapping using semantic badge classes
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-primary text-primary-foreground border-transparent',
  MANAGER: 'badge--manifested',
  OPS: 'badge--created',
  WAREHOUSE_IMPHAL: 'badge--in-transit',
  WAREHOUSE_DELHI: 'badge--in-transit',
  INVOICE: 'badge--delivered',
  SUPPORT: 'badge--cancelled',
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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-muted flex items-center justify-center border border-white/10">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
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
        <Badge className={ROLE_COLORS[row.original.role] || ROLE_COLORS.SUPPORT}>
          {row.original.role.replace(/_/g, ' ')}
        </Badge>
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
            className={`w-1.5 h-1.5 rounded-none ${
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
          <Button
            variant={row.original.is_active ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() => params.onToggleStatus(row.original)}
            className={row.original.is_active ? 'text-destructive hover:text-destructive/80' : ''}
          >
            {row.original.is_active ? (
              <>
                <X className="w-3 h-3 mr-1" /> Deactivate
              </>
            ) : (
              <>
                <Check className="w-3 h-3 mr-1" /> Activate
              </>
            )}
          </Button>
          <CrudRowActions
            onEdit={() => params.onEdit(row.original)}
            onDelete={() => params.onDelete(row.original)}
          />
        </div>
      ),
    },
  ];
}
