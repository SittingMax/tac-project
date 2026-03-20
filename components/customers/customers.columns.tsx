'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CrudRowActions } from '@/components/crud/CrudRowActions';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building, User, FileText } from 'lucide-react';
import { Customer } from '@/hooks/useCustomers';
import { IdBadge } from '@/components/ui-core/data/id-badge';

export interface CustomersColumnsParams {
  onView: (row: Customer) => void;
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
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            params.onView(row.original);
          }}
        >
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
            {row.original.type === 'BUSINESS' ? (
              <Building className="w-4 h-4" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="font-medium text-foreground group-hover:text-primary transition-colors">{row.original.name}</div>
            <IdBadge
              entity="customer"
              idValue={row.original.id}
              cnNumber={row.original.customer_code}
            />
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
          <div className="flex gap-4 mt-1 text-xs">
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
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="secondary">{row.original.type.replace(/_/g, ' ')}</Badge>,
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
