import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const RANGES = [
  { label: 'Today', value: '0d' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

export const DateRangeSelector = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentRange = searchParams.get('range') || '30d';

  const handleSelect = (val: string) => {
    // Keep other params, just update range
    const newParams = new URLSearchParams(searchParams);
    newParams.set('range', val);
    setSearchParams(newParams);
  };

  const activeLabel = RANGES.find((r) => r.value === currentRange)?.label || 'Last 30 Days';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-10 border-dashed gap-2 text-muted-foreground hover:text-foreground hidden sm:flex',
            currentRange !== 'all' && 'border-solid text-foreground'
          )}
        >
          <Calendar className="w-4 h-4" />
          <span>{activeLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="flex flex-col gap-1">
          <div className="px-2 pt-1 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Time Range
          </div>
          {RANGES.map((r) => (
            <Button
              key={r.value}
              variant={currentRange === r.value ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'justify-start font-normal transition-colors',
                currentRange === r.value ? 'font-medium' : ''
              )}
              onClick={() => handleSelect(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
