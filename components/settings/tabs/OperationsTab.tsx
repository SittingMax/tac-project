import { OperationalCard } from '../cards/OperationalCard';
import { HubTable } from '../tables/HubTable';

export function OperationsTab() {
  return (
    <div className="flex flex-col gap-6">
      <OperationalCard />
      <HubTable />
    </div>
  );
}
