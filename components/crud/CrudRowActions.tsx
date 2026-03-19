'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface CrudRowActionsProps {
  onEdit: () => void;
  editLabel?: string;
  onDelete?: () => void;
  extraItems?: { label: string; icon?: React.ReactNode; onClick: () => void }[];
  disabled?: boolean;
}

/**
 * Reusable row actions dropdown for CRUD tables.
 * Provides Edit and Delete options, with support for additional custom actions.
 */
export function CrudRowActions({
  onEdit,
  editLabel = 'Edit',
  onDelete,
  extraItems,
  disabled = false,
}: CrudRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled}>
          <MoreHorizontal size={16} strokeWidth={1.5} />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Pencil size={16} strokeWidth={1.5} className="mr-2" />
          {editLabel}
        </DropdownMenuItem>

        {extraItems?.map((item, index) => (
          <DropdownMenuItem key={index} onClick={item.onClick} className="cursor-pointer">
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </DropdownMenuItem>
        ))}

        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 size={16} strokeWidth={1.5} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
