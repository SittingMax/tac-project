import React from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CheckCircle2, Box, AlertTriangle, Package } from 'lucide-react';

interface AuditStatsPanelProps {
    stats: {
        total: number;
        scanned: number;
        missing: number;
        exceptions: number;
    };
}

export const AuditStatsPanel: React.FC<AuditStatsPanelProps> = ({ stats }) => {
    const progressPercent = stats.total > 0 ? (stats.scanned / stats.total) * 100 : 0;

    return (
        <div className="space-y-4">
            {/* Progress Bar */}
            <div className="h-2 w-full bg-muted/30 overflow-hidden">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 rounded-none border border-border bg-background flex flex-col items-center justify-center text-center">
                    <Package className="w-6 h-6 text-muted-foreground mb-2" />
                    <div className="text-3xl font-black font-mono tracking-tighter text-foreground">{stats.total}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Expected</div>
                </Card>

                <Card className="p-4 rounded-none border border-border bg-background flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {stats.scanned > 0 && (
                        <div className="absolute inset-0 bg-status-success/5 border-b-2 border-status-success pointer-events-none" />
                    )}
                    <CheckCircle2 className="w-6 h-6 text-status-success mb-2 relative z-10" />
                    <div className="text-3xl font-black font-mono tracking-tighter text-status-success relative z-10">{stats.scanned}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 relative z-10">Scanned</div>
                </Card>

                <Card className="p-4 rounded-none border border-border bg-background flex flex-col items-center justify-center text-center">
                    <Box className="w-6 h-6 text-muted-foreground mb-2 opacity-50" />
                    <div className="text-3xl font-black font-mono tracking-tighter text-foreground">{stats.missing}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Pending</div>
                </Card>

                <Card className="p-4 rounded-none border border-border bg-background flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {stats.exceptions > 0 && (
                        <div className="absolute inset-0 bg-status-error/5 border-b-2 border-status-error pointer-events-none" />
                    )}
                    <AlertTriangle className={`w-6 h-6 mb-2 relative z-10 ${stats.exceptions > 0 ? 'text-status-error' : 'text-muted-foreground opacity-50'}`} />
                    <div className={`text-3xl font-black font-mono tracking-tighter relative z-10 ${stats.exceptions > 0 ? 'text-status-error' : 'text-foreground'}`}>{stats.exceptions}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 relative z-10">Exceptions</div>
                </Card>
            </div>
        </div>
    );
};
