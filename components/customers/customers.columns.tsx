'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CrudRowActions } from '@/components/crud/CrudRowActions';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building, User, FileText } from 'lucide-react';
import { Customer } from '@/hooks/useCustomers';

export interface CustomersColumnsParams {
  onEdit: (row: Customer) => void;
  onDelete: (row: Customer) => void;
}

/**
 * Generate column definitions for the customers table.
 * Includes callbacks for edit and delete actions.
 */
export function getCustomersColumns(params: CustomersColumnsParams): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-muted flex items-center justify-center text-primary">
            {row.original.type === 'BUSINESS' ? (
              <Building className="w-4 h-4" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="font-medium text-foreground">
              {row.original.companyName || row.original.name}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {row.original.customer_code}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'contact',
      header: 'Contact Info',
      cell: ({ row }) => (
        <div>
          <div className="text-sm text-muted-foreground">{row.original.name}</div>
          <div className="flex gap-3 mt-1 text-xs">
            {row.original.email && (
              <a
                href={`mailto:${row.original.email}`}
                className="text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <Mail className="w-3 h-3" /> {row.original.email}
              </a>
            )}
            <a
              href={`tel:${row.original.phone}`}
              className="text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <Phone className="w-3 h-3" /> {row.original.phone}
            </a>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
      cell: ({ row }) => {
        const tier = row.original.tier || 'STANDARD';
        return (
          <Badge
            variant={tier === 'ENTERPRISE' ? 'default' : 'secondary'}
            className={
              tier === 'ENTERPRISE'
                ? 'bg-primary text-primary-foreground'
                : tier === 'PRIORITY'
                  ? 'bg-status-warning/20 text-status-warning'
                  : ''
            }
          >
            {tier}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'gstin',
      header: 'GSTIN',
      cell: ({ row }) =>
        row.original.gstin ? (
          <div className="font-mono text-xs flex items-center gap-1">
            <FileText className="w-3 h-3 text-muted-foreground" />
            {row.original.gstin}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'credit_limit',
      header: 'Credit Limit',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          ₹{row.original.credit_limit?.toLocaleString('en-IN') ?? '0'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <CrudRowActions
          onEdit={() => params.onEdit(row.original)}
          onDelete={() => params.onDelete(row.original)}
        />
      ),
    },
  ];
}
