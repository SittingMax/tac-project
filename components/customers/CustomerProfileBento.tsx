import { Customer } from '@/hooks/useCustomers';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building, User, Mail, Phone, FileText, MapPin, Receipt, Star, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IdBadge } from '@/components/ui-core/data/id-badge';
import { formatDate } from '@/lib/formatters';

interface CustomerProfileBentoProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerProfileBento({ customer, open, onOpenChange }: CustomerProfileBentoProps) {
  if (!customer) return null;

  const isBusiness = customer.type === 'BUSINESS' || customer.type === 'CORPORATE';

  const readAddressValue = (value: unknown) => (typeof value === 'string' ? value : '');
  let addressLine = '';
  if (customer.address) {
    if (typeof customer.address === 'string') {
      addressLine = customer.address;
    } else if (typeof customer.address === 'object' && !Array.isArray(customer.address)) {
      const addr = customer.address as Record<string, unknown>;
      const line1 = readAddressValue(addr.line1 ?? addr.street ?? addr.address);
      const city = readAddressValue(addr.city);
      const state = readAddressValue(addr.state);
      const zip = readAddressValue(addr.postal_code ?? addr.zip);
      addressLine = [line1, city, state, zip].filter(Boolean).join(', ');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] p-0 flex flex-col bg-muted/20">
        <SheetHeader className="p-6 pb-4 bg-background border-b border-border/50">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {isBusiness ? <Building className="size-6" /> : <User className="size-6" />}
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold tracking-tight">{customer.name}</SheetTitle>
              <div className="flex items-center gap-3 mt-1.5">
                <IdBadge entity="customer" idValue={customer.id} cnNumber={customer.customer_code} />
                <Badge variant="secondary" className="text-[10px] font-mono rounded-sm px-1.5">
                  {customer.type}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Quick Stats Bento */}
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-background rounded-xl p-4 border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Receipt className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Credit Limit</span>
                </div>
                <div className="text-2xl font-mono font-bold">
                  ₹{customer.credit_limit?.toLocaleString('en-IN') ?? '0'}
                </div>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Star className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Status</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="size-2 rounded-full bg-status-success animate-pulse" />
                  <span className="font-medium text-sm">Active Account</span>
                </div>
              </div>
            </div>

            {/* Contact Info Bento */}
            <div className="col-span-2 bg-background rounded-xl p-5 border border-border/50 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <User className="size-4 text-muted-foreground" /> Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-y-4 text-sm mt-1">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Email</div>
                  <div className="flex items-center gap-2 font-medium">
                    <Mail className="size-3 text-muted-foreground" />
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="hover:text-primary transition-colors">{customer.email}</a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Phone</div>
                  <div className="flex items-center gap-2 font-medium">
                    <Phone className="size-3 text-muted-foreground" />
                    {customer.phone ? (
                      <a href={`tel:${customer.phone}`} className="hover:text-primary transition-colors">{customer.phone}</a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                {customer.gstin && (
                  <div className="col-span-2 pt-3 border-t border-border/30">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">GSTIN</div>
                    <div className="flex items-center gap-2 font-mono text-sm font-medium">
                      <FileText className="size-3 text-muted-foreground" />
                      {customer.gstin}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Bento */}
            <div className="col-span-2 bg-background rounded-xl p-5 border border-border/50 shadow-sm">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <MapPin className="size-4 text-muted-foreground" /> Billing Address
              </h3>
              {addressLine ? (
                <p className="text-sm text-foreground leading-relaxed pl-6">{addressLine}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic pl-6">No address provided</p>
              )}
            </div>

            {/* Key Information Bento */}
            <div className="col-span-2 bg-background rounded-xl p-5 border border-border/50 shadow-sm">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Clock className="size-4 text-muted-foreground" /> Key Information
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                 <div className="flex justify-between items-center pb-2 border-b border-border/30">
                   <span className="text-muted-foreground">Account Created</span>
                   <span className="font-medium font-mono text-xs">{formatDate(customer.created_at || new Date().toISOString())}</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-border/30">
                   <span className="text-muted-foreground">Payment Terms</span>
                   <span className="font-medium">Net 30</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-muted-foreground">Default Service Level</span>
                   <Badge variant="outline" className="text-[10px] font-mono">STANDARD</Badge>
                 </div>
              </div>
            </div>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
