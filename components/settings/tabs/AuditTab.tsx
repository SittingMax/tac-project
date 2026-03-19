import { AuditTable } from '../tables/AuditTable';

export function AuditTab() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <AuditTable />
    </div>
  );
}
