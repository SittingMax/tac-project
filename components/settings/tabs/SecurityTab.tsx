import { SecurityCard } from '../cards/SecurityCard';
import { NotificationCard } from '../cards/NotificationCard';

export function SecurityTab() {
  return (
    <div className="flex flex-col gap-6">
      <SecurityCard />
      <NotificationCard />
    </div>
  );
}
