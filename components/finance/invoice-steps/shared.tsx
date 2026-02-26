import React, { useState, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { Customer as CustomerDB } from '@/hooks/useCustomers';
import { ChevronDown, Plane, Truck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export const SectionHeader: React.FC<{ icon: React.ElementType; title: string; action?: React.ReactNode }> = ({
    icon: Icon,
    title,
    action,
}) => (
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-none bg-primary/10 text-primary border border-primary/20">
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold tracking-wide text-foreground uppercase">{title}</span>
        </div>
        {action}
    </div>
);

export const Label: React.FC<{
    children: React.ReactNode;
    required?: boolean;
    error?: string;
    className?: string;
}> = ({ children, required, error, className }) => (
    <div className={`flex justify-between items-end mb-2 ${className}`}>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            {children}
            {required && <span className="text-destructive text-xs leading-none">*</span>}
        </label>
        {error && <span className="text-xs text-destructive font-medium">{error}</span>}
    </div>
);

// Searchable Customer Combobox — Popover + plain list (no cmdk)
export const CustomerSearch: React.FC<{
    customers: CustomerDB[];
    onSelect: (c: CustomerDB) => void;
    placeholder?: string;
}> = ({ customers, onSelect, placeholder = 'Search...' }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [displayLabel, setDisplayLabel] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const fuse = useMemo(
        () =>
            new Fuse(customers, {
                keys: ['name', 'companyName', 'phone'],
                threshold: 0.3,
                includeScore: true,
            }),
        [customers]
    );

    const filtered = useMemo(() => {
        if (!search) return customers.slice(0, 5);
        return fuse
            .search(search)
            .slice(0, 5)
            .map((result) => result.item);
    }, [search, fuse, customers]);

    const handleSelect = (c: CustomerDB) => {
        onSelect(c);
        const label = c.companyName || c.name;
        setDisplayLabel(label);
        setSearch('');
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (nextOpen) {
                setSearch('');
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-9 text-xs"
                    type="button"
                >
                    <span className={`truncate ${displayLabel ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {displayLabel || placeholder}
                    </span>
                    <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="flex items-center border-b border-border px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        placeholder="Type to filter..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 text-xs border-0 ring-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
                <ScrollArea className="max-h-[200px]">
                    <div className="p-1">
                        {filtered.length === 0 ? (
                            <div className="py-4 text-center text-xs text-muted-foreground">No match.</div>
                        ) : (
                            filtered.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleSelect(c)}
                                    className="w-full text-left flex flex-col items-start gap-0.5 cursor-pointer rounded-none px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    <div className="text-xs font-bold text-foreground flex items-center justify-between w-full">
                                        <span>{c.companyName || c.name}</span>
                                        {c.tier === 'ENTERPRISE' && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-none bg-primary/10 text-primary font-semibold">
                                                VIP
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-[10px] text-muted-foreground">{c.phone}</span>
                                        {c.invoiceCount && (
                                            <span className="text-[9px] text-muted-foreground">
                                                {c.invoiceCount} invoices · ₹{(c.avgInvoiceValue || 0).toLocaleString()} avg
                                            </span>
                                        )}
                                    </div>
                                    {c.preferences && (
                                        <div className="flex gap-1 mt-0.5">
                                            {c.preferences.preferredTransportMode && (
                                                <span className="text-[8px] px-1 py-0.5 rounded-none bg-muted text-muted-foreground flex items-center gap-1">
                                                    {c.preferences.preferredTransportMode === 'AIR' ? (
                                                        <Plane className="w-2.5 h-2.5" />
                                                    ) : (
                                                        <Truck className="w-2.5 h-2.5" />
                                                    )}
                                                    {c.preferences.preferredTransportMode}
                                                </span>
                                            )}
                                            {c.preferences.preferredPaymentMode && (
                                                <span className="text-[8px] px-1 py-0.5 rounded-none bg-muted text-muted-foreground">
                                                    {c.preferences.preferredPaymentMode}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};
