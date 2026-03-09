/**
 * EnhancedDataTable Component
 * Premium data table with toolbar, filters, bulk actions, and column visibility
 * Built on @tanstack/react-table with shadcn/ui components
 */

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Checkbox } from './checkbox';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns3,
  Download,
  X,
  CalendarIcon,
  Filter,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

// Filter types
export interface FilterOption {
  label: string;
  value: string;
}

export interface ColumnFilter {
  id: string;
  label: string;
  type: 'select' | 'date' | 'date-range' | 'text';
  options?: FilterOption[];
  placeholder?: string;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ElementType;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: (selectedIds: string[]) => void | Promise<void>;
  disabled?: boolean;
  confirmation?: string;
}

export interface EnhancedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Key for global search */
  searchKey?: string;
  searchPlaceholder?: string;
  /** Column-specific filters */
  filters?: ColumnFilter[];
  /** Bulk actions for selected rows */
  bulkActions?: BulkAction[];
  /** Export functionality */
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  /** Get row ID for selection */
  getRowId?: (row: TData) => string;
  /** Initial page size */
  pageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Enable row selection */
  enableSelection?: boolean;
  /** Enable column visibility toggle */
  enableColumnVisibility?: boolean;
  /** Custom toolbar content */
  toolbarContent?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom class */
  className?: string;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function EnhancedDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  filters = [],
  bulkActions = [],
  onExport,
  getRowId,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  enableSelection = true,
  enableColumnVisibility = true,
  toolbarContent,
  loading = false,
  emptyMessage = 'No results found.',
  className,
  onSelectionChange,
}: EnhancedDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize });

  // Track selected row IDs
  const selectedIds = React.useMemo(() => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]);
  }, [rowSelection]);

  // Notify parent of selection changes
  React.useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  // Build table with enhanced columns
  const tableColumns = React.useMemo(() => {
    if (!enableSelection) return columns;

    const selectionColumn: ColumnDef<TData, unknown> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
      size: 40,
    };

    return [selectionColumn, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
      pagination,
    },
  });

  // Clear selection
  const clearSelection = () => {
    setRowSelection({});
  };

  // Sort icon component
  const SortIcon = ({ column }: { column: { getIsSorted: () => false | 'asc' | 'desc' } }) => {
    const sorted = column.getIsSorted();
    if (sorted === 'asc') return <ArrowUp className="size-3" />;
    if (sorted === 'desc') return <ArrowDown className="size-3" />;
    return <ArrowUpDown className="size-3 opacity-50" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search and Filters */}
        <div className="flex flex-1 items-center gap-2">
          {/* Global Search */}
          {(searchKey || globalFilter !== undefined) && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={
                  searchKey
                    ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? '')
                    : globalFilter
                }
                onChange={(e) => {
                  if (searchKey) {
                    table.getColumn(searchKey)?.setFilterValue(e.target.value);
                  } else {
                    setGlobalFilter(e.target.value);
                  }
                }}
                className="pl-9"
              />
            </div>
          )}

          {/* Column Filters */}
          {filters.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="size-4" />
                  Filters
                  {Object.keys(columnFilters).length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {Object.keys(columnFilters).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Filter by</h4>
                  {filters.map((filter) => (
                    <div key={filter.id} className="space-y-2">
                      <label className="text-sm text-muted-foreground">{filter.label}</label>
                      {filter.type === 'select' && filter.options && (
                        <Select
                          value={(table.getColumn(filter.id)?.getFilterValue() as string) ?? ''}
                          onValueChange={(value) =>
                            table.getColumn(filter.id)?.setFilterValue(value || undefined)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={filter.placeholder || 'Select...'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All</SelectItem>
                            {filter.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {filter.type === 'text' && (
                        <Input
                          placeholder={filter.placeholder || 'Enter value...'}
                          value={(table.getColumn(filter.id)?.getFilterValue() as string) ?? ''}
                          onChange={(e) =>
                            table.getColumn(filter.id)?.setFilterValue(e.target.value || undefined)
                          }
                        />
                      )}
                      {filter.type === 'date' && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-muted-foreground"
                            >
                              <CalendarIcon className="mr-2 size-4" />
                              {(table.getColumn(filter.id)?.getFilterValue() as Date)
                                ? format(
                                    table.getColumn(filter.id)?.getFilterValue() as Date,
                                    'PPP'
                                  )
                                : filter.placeholder || 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={table.getColumn(filter.id)?.getFilterValue() as Date}
                              onSelect={(date) =>
                                table.getColumn(filter.id)?.setFilterValue(date || undefined)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  ))}
                  {Object.keys(columnFilters).length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => table.resetColumnFilters()}
                      className="w-full"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Custom toolbar content */}
          {toolbarContent}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Columns3 className="size-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export */}
          {onExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="size-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport('csv')}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('excel')}>
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('pdf')}>Export as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {enableSelection && selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/10 border border-border/40 rounded-none">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="size-4 mr-1" />
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => action.onClick(selectedIds)}
                disabled={action.disabled}
                className="gap-2"
              >
                {action.icon && <action.icon className="size-4" />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      className="bg-muted/30"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            'flex items-center gap-1 font-mono uppercase text-[10px] tracking-widest text-muted-foreground',
                            header.column.getCanSort() &&
                              'cursor-pointer select-none hover:text-foreground transition-colors'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <SortIcon column={header.column} />}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-12 rounded-none bg-muted/10 border border-border/40 flex items-center justify-center">
                        <Search className="size-5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">{emptyMessage}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing{' '}
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </p>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
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
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EnhancedDataTable;
