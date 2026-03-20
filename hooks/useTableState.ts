import {
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  type Table as TanStackTable,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';

interface UseTableStateOptions<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  enableColumnFilters?: boolean;
  enableColumnResizing?: boolean;
  enableRowSelection?: boolean;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  pageSize?: number;
  rowSelection?: RowSelectionState;
  searchValue?: string;
}

interface UseTableStateResult<TData> {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  table: TanStackTable<TData>;
}

export function useTableState<TData>({
  columns,
  data,
  enableColumnFilters = false,
  enableColumnResizing = false,
  enableRowSelection = false,
  onRowSelectionChange,
  pageSize,
  rowSelection: controlledRowSelection,
  searchValue,
}: UseTableStateOptions<TData>): UseTableStateResult<TData> {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const handleRowSelectionChange = onRowSelectionChange ?? setInternalRowSelection;

  useEffect(() => {
    if (searchValue !== undefined) {
      setGlobalFilter(searchValue);
    }
  }, [searchValue]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection,
    ...(enableColumnResizing ? { columnResizeMode: 'onChange' as const } : {}),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    ...(enableColumnFilters ? { onColumnFiltersChange: setColumnFilters } : {}),
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
      ...(enableColumnFilters ? { columnFilters } : {}),
    },
    ...(pageSize !== undefined
      ? {
          initialState: {
            pagination: {
              pageSize,
            },
          },
        }
      : {}),
  });

  return {
    globalFilter,
    setGlobalFilter,
    table,
  };
}
