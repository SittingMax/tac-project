import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useExceptions } from '@/hooks/useExceptions';
import { useBookings } from '@/hooks/useBookings';
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui-core';

export const NextBestAction: React.FC = () => {
  const navigate = useNavigate();
  const { data: exceptions = [], isLoading: isLoadingExc } = useExceptions({ status: 'OPEN' });
  const { data: bookings = [], isLoading: isLoadingBookings } = useBookings({ limit: 10 });
  
  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'PENDING'), [bookings]);
  const criticalExceptions = useMemo(() => exceptions.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH'), [exceptions]);

  const isLoading = isLoadingExc || isLoadingBookings;

  const getUrgentItems = () => {
    const items = [];
    if (criticalExceptions.length > 0) {
      items.push({
        id: 'exc-' + criticalExceptions[0].id,
        title: 'Critical Exception requires review',
        description: criticalExceptions[0].description,
        icon: AlertCircle,
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        action: 'Review Now',
        onClick: () => navigate('/exceptions')
      });
    }
    if (pendingBookings.length > 0) {
      items.push({
        id: 'book-' + pendingBookings[0].id,
        title: `${pendingBookings.length} Pending Bookings`,
        description: 'New booking requests need approval',
        icon: Clock,
        color: 'text-primary',
        bg: 'bg-primary/10',
        action: 'Review Bookings',
        onClick: () => navigate('/bookings')
      });
    }
    
    if (items.length === 0 && !isLoading) {
      items.push({
        id: 'all-clear',
        title: 'All operations normal',
        description: 'No urgent actions required at this time',
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        action: 'View Overview',
        onClick: () => navigate('/shipments')
      });
    }
    return items.slice(0, 3);
  };

  const tasks = getUrgentItems();

  return (
    <Card className="h-full flex flex-col border border-border/50 bg-background shadow-none rounded-xl">
      <CardHeader className="pb-3 border-b border-border/50 px-5 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
          Next Best Action
          <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground bg-muted/50 border border-border/50 px-2 py-0.5 rounded-sm">
            {tasks[0]?.id === 'all-clear' ? '0' : tasks.length} actions
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="flex flex-col divide-y divide-border/30 h-full justify-start">
          {isLoading ? (
             <div className="p-8 flex items-center justify-center text-muted-foreground text-sm font-mono tracking-wide animate-pulse">Scanning telemetry...</div>
          ) : tasks.map((task) => (
             <div key={task.id} className="p-5 flex flex-col gap-4 group hover:bg-muted/10 transition-colors">
               <div className="flex gap-4 items-start">
                 <div className={`p-2.5 rounded-lg ${task.bg}`}>
                   <AppIcon icon={task.icon} className={`w-4 h-4 ${task.color}`} />
                 </div>
                 <div className="flex-1 space-y-1 mt-0.5">
                   <p className="text-sm font-semibold tracking-tight leading-none text-foreground">{task.title}</p>
                   <p className="text-xs text-muted-foreground leading-snug">{task.description}</p>
                 </div>
               </div>
               <Button onClick={task.onClick} variant="outline" size="sm" className="w-full justify-between text-xs h-8 bg-transparent shadow-none hover:bg-muted/50 border-border/50">
                 {task.action}
                 <AppIcon icon={ArrowRight} className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
               </Button>
             </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
