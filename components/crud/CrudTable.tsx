'use client';

import { ColumnDef, RowSelectionState, flexRender } from '@tanstack/react-table';
import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTableState } from '@/hooks/useTableState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
  Columns,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export interface CrudTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  loadingState?: React.ReactNode;
  emptyState?:
    | React.ReactNode
    | ((ctx: { isFiltered: boolean; filter: string }) => React.ReactNode);
  /** Toolbar content (e.g., filters, create button) */
  toolbar?: React.ReactNode;
  /** Optional callback for server-side search */
  onSearch?: (term: string) => void;
  /** Optional controlled search value */
  searchValue?: string;
  /** Enable column visibility toggle */
  enableColumnVisibility?: boolean;
  /** Enable row selection */
  enableRowSelection?: boolean;
  /** Controlled row selection state */
  rowSelection?: RowSelectionState;
  /** Callback for row selection changes */
  onRowSelectionChange?: (
    updater: import('@tanstack/react-table').Updater<RowSelectionState>
  ) => void;
  /** Content to render for bulk actions (usually buttons that react to table.getSelectedRowModel()) */
  bulkActions?: (table: import('@tanstack/react-table').Table<TData>) => React.ReactNode;
  /** Optional callback for row clicks */
  onRowClick?: (row: TData) => void;
}

/**
 * Reusable CRUD table component with sorting, filtering, and pagination.
 * Built on top of TanStack Table.
 */
export function CrudTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  className,
  isLoading = false,
  emptyMessage = 'No results found.',
  loadingState,
  emptyState,

  toolbar,
  onSearch,
  searchValue,
  enableColumnVisibility = true,
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  bulkActions,
  onRowClick,
}: CrudTableProps<TData>) {
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});

  const isControlledRowSelection = controlledRowSelection !== undefined;
  const rowSelection = isControlledRowSelection ? controlledRowSelection : internalRowSelection;
  const setRowSelection = isControlledRowSelection
    ? onRowSelectionChange!
    : setInternalRowSelection;

  const finalColumns = useMemo(() => {
    if (!enableRowSelection) return columns;
    const selectColumn: ColumnDef<TData, unknown> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };
    return [selectColumn, ...columns];
  }, [columns, enableRowSelection]);

  const { globalFilter, setGlobalFilter, table } = useTableState({
    data,
    columns: finalColumns,
    enableColumnResizing: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    pageSize,
    rowSelection,
    searchValue,
  });

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {searchKey && (
          <div className="relative flex-1 max-w-sm">
            <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setGlobalFilter(value);
                onSearch?.(value);
              }}
              className="pl-9"
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {table.getSelectedRowModel().rows.length > 0 && bulkActions && bulkActions(table)}
          {toolbar}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                  <Columns size={16} strokeWidth={1.5} />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px]">
                {table
                  .getAllColumns()
                  .filter(
                    (column) => typeof column.accessorFn !== 'undefined' && column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id.replace(/_/g, ' ')}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isLoading ? (
        loadingState || <TableSkeleton rows={pageSize} columns={columns.length} />
      ) : table.getRowModel().rows.length === 0 && emptyState ? (
        typeof emptyState === 'function' ? (
          emptyState({ isFiltered: globalFilter.trim().length > 0, filter: globalFilter })
        ) : (
          emptyState
        )
      ) : (
        <>
          {/* Table */}
          <div className="border border-border/40 overflow-hidden bg-card text-foreground shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="relative group transition-colors"
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : (
                            <>
                              <div
                                className={cn(
                                  'flex items-center gap-1',
                                  header.column.getCanSort() &&
                                    'cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors'
                                )}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getCanSort() && (
                                  <ArrowUpDown size={12} strokeWidth={1.5} className="ml-1" />
                                )}
                              </div>
                              {/* Column Resizer */}
                              <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={cn(
                                  'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-border opacity-0 group-hover:opacity-100 transition-opacity',
                                  header.column.getIsResizing() ? 'bg-primary opacity-100' : ''
                                )}
                              />
                            </>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                        className={cn(
                          'transition-colors hover:bg-muted/5',
                          onRowClick ? 'cursor-pointer' : ''
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {data.length > pageSize && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}{' '}
                to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of {table.getFilteredRowModel().rows.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft size={16} strokeWidth={1.5} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight size={16} strokeWidth={1.5} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight size={16} strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
