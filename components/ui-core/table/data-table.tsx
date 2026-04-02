import { Children, isValidElement, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CrudTable } from '@/components/crud/CrudTable';

type DataTableSearchProps = {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
};

type DataTableContentProps<TData> = {
  emptyMessage?: string;
  emptyState?: ReactNode;
  onRowClick?: (row: TData) => void;
};

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  children: ReactNode;
  isLoading?: boolean;
  enableRowSelection?: boolean;
};

function DataTableToolbar({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function DataTableSearch(_props: DataTableSearchProps) {
  return null;
}

function DataTableActions({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function DataTableViewOptions() {
  return null;
}

function DataTableContent<TData>(_props: DataTableContentProps<TData>) {
  return null;
}

function DataTablePagination() {
  return null;
}

function useDataTableContext() {
  throw new Error(
    'DataTable.useContext is no longer supported. Use CrudTable bulkActions instead.'
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  children,
  isLoading,
  enableRowSelection = false,
}: DataTableProps<TData, TValue>) {
  let searchProps: DataTableSearchProps = {};
  let hasSearch = false;
  const toolbarContent: ReactNode[] = [];
  let emptyState: ReactNode | undefined;
  let emptyMessage: string | undefined;
  let onRowClick: ((row: TData) => void) | undefined;
  let enableColumnVisibility = false;

  Children.forEach(children, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) {
      return;
    }

    const element = child;

    if (element.type === DataTableToolbar) {
      const toolbarChildren = Children.toArray(element.props.children);
      toolbarChildren.forEach((toolbarChild) => {
        if (!isValidElement<DataTableSearchProps | { children?: ReactNode }>(toolbarChild)) {
          toolbarContent.push(toolbarChild);
          return;
        }

        const toolbarElement = toolbarChild;

        if (toolbarElement.type === DataTableSearch) {
          searchProps = toolbarElement.props as DataTableSearchProps;
          hasSearch = true;
          return;
        }

        if (toolbarElement.type === DataTableActions) {
          toolbarContent.push((toolbarElement.props as { children?: ReactNode }).children);
          return;
        }

        if (toolbarElement.type === DataTableViewOptions) {
          enableColumnVisibility = true;
          return;
        }

        toolbarContent.push(toolbarElement);
      });
      return;
    }

    if (element.type === DataTableContent) {
      const contentProps = element.props as DataTableContentProps<TData>;
      emptyState = contentProps.emptyState;
      emptyMessage = contentProps.emptyMessage;
      onRowClick = contentProps.onRowClick;
      return;
    }

    if (element.type === DataTablePagination) {
      return;
    }
  });

  return (
    <CrudTable
      columns={columns as ColumnDef<TData, unknown>[]}
      data={data}
      isLoading={isLoading}
      searchKey={hasSearch ? 'compat' : undefined}
      searchPlaceholder={searchProps.placeholder}
      searchValue={searchProps.value}
      onSearch={searchProps.onChange}
      enableColumnVisibility={enableColumnVisibility}
      enableRowSelection={enableRowSelection}
      toolbar={toolbarContent.length > 0 ? <>{toolbarContent}</> : undefined}
      emptyState={emptyState}
      emptyMessage={emptyMessage}
      onRowClick={onRowClick}
    />
  );
}

DataTable.Toolbar = DataTableToolbar;
DataTable.Search = DataTableSearch;
DataTable.Actions = DataTableActions;
DataTable.ViewOptions = DataTableViewOptions;
DataTable.Content = DataTableContent;
DataTable.Pagination = DataTablePagination;
DataTable.useContext = useDataTableContext;
