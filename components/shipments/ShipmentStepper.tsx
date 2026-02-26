import React from 'react';
import { Check, Truck, Package, MapPin, Flag, AlertTriangle, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

// The canonical order of standard shipment statuses
const STANDARD_FLOW = [
    'PENDING',
    'PICKED_UP',
    'IN_TRANSIT',
    'RECEIVED_AT_DEST',
    'OUT_FOR_DELIVERY',
    'DELIVERED'
];

interface ShipmentStepperProps {
    currentStatus: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    events: any[];
}

export const ShipmentStepper: React.FC<ShipmentStepperProps> = ({ currentStatus, events }) => {
    const isException = currentStatus === 'EXCEPTION';
    const isCancelled = currentStatus === 'CANCELLED';

    // Find the furthest standard status reached before exception/cancellation
    let furthestIndex = -1;
    const reachedIndexes = new Set<number>();

    if (isException || isCancelled) {
        // Look at events to see how far it got
        events.forEach(evt => {
            const code = evt.event_code || evt.eventCode;
            const idx = STANDARD_FLOW.indexOf(code);
            if (idx !== -1) {
                reachedIndexes.add(idx);
                furthestIndex = Math.max(furthestIndex, idx);
            }
        });
        if (furthestIndex === -1 && events.length > 0) {
            furthestIndex = 0; // At least pending
        }
    } else {
        furthestIndex = STANDARD_FLOW.indexOf(currentStatus);
        if (furthestIndex === -1) {
            // If it's some custom status, default to pending visually
            furthestIndex = 0;
        }
    }

    const getStepIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Box className="w-4 h-4" />;
            case 'PICKED_UP': return <Package className="w-4 h-4" />;
            case 'IN_TRANSIT': return <Truck className="w-4 h-4" />;
            case 'RECEIVED_AT_DEST': return <MapPin className="w-4 h-4" />;
            case 'OUT_FOR_DELIVERY': return <Truck className="w-4 h-4" />;
            case 'DELIVERED': return <Flag className="w-4 h-4" />;
            default: return <Check className="w-4 h-4" />;
        }
    };

    const formatStepLabel = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const getEventTimeForStatus = (status: string) => {
        // Find the earliest event that matches this status to show when it entered this stage
        const evt = [...events].reverse().find(e => (e.event_code || e.eventCode) === status);
        if (!evt) return null;
        const time = evt.event_time || evt.eventTime;
        return new Date(time).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="w-full py-6 overflow-x-auto scrollbar-hide">
            <div className="flex items-center min-w-[600px] px-4">
                {STANDARD_FLOW.map((stepStatus, idx) => {
                    const isCompleted = isException || isCancelled ? reachedIndexes.has(idx) : idx < furthestIndex;
                    const isCurrent = isException || isCancelled ? false : idx === furthestIndex;
                    const timestamp = getEventTimeForStatus(stepStatus);

                    return (
                        <React.Fragment key={stepStatus}>
                            {/* Step Circle & Label */}
                            <div className="relative flex flex-col items-center flex-1">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-none flex items-center justify-center border-2 z-10 bg-card transition-colors duration-500",
                                        isCompleted ? "border-primary bg-primary text-primary-foreground" :
                                            isCurrent ? "border-primary text-primary ring-4 ring-primary/20" :
                                                "border-muted bg-muted text-muted-foreground"
                                    )}
                                >
                                    {isCompleted ? <Check className="w-5 h-5" /> : getStepIcon(stepStatus)}
                                </div>

                                {/* Exception branching indicator if this is the furthest step */}
                                {idx === furthestIndex && isException && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-in slide-in-from-bottom-2">
                                        <div className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-none uppercase tracking-wider whitespace-nowrap shadow-sm mb-1 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Exception
                                        </div>
                                        <div className="w-0.5 h-4 bg-destructive rounded-none" />
                                    </div>
                                )}

                                <div className="absolute top-12 flex flex-col items-center w-32 text-center">
                                    <span className={cn(
                                        "text-xs font-semibold tracking-tight whitespace-nowrap",
                                        isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {formatStepLabel(stepStatus)}
                                    </span>
                                    {timestamp && (
                                        <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                            {timestamp}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Connecting Line */}
                            {idx < STANDARD_FLOW.length - 1 && (
                                <div className="flex-1 h-0.5 bg-muted mx-2 relative -top-6">
                                    <div
                                        className={cn(
                                            "absolute top-0 left-0 h-full bg-primary transition-all duration-1000",
                                            isCompleted ? "w-full" : "w-0"
                                        )}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
