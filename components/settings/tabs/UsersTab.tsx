import { UsersTable } from '../tables/UsersTable';

export function UsersTab() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <UsersTable />
    </div>
  );
}
