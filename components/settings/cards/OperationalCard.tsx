'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Truck, Loader2 } from 'lucide-react';
import { SHIPMENT_MODES, SERVICE_LEVELS, PAYMENT_MODES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { settingsService } from '@/lib/services/settingsService';
import { useAuthStore } from '@/store/authStore';

interface OperationalSettings {
  defaultMode?: string;
  defaultServiceLevel?: string;
  paymentMode?: string;
  exportFormat?: string;
  autoManifest?: boolean;
  autoInvoice?: boolean;
  mandatoryScanning?: boolean;
}

export function OperationalCard() {
  const [isBusy, setIsBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultMode, setDefaultMode] = useState('TRUCK');
  const [defaultServiceLevel, setDefaultServiceLevel] = useState('STANDARD');
  const [paymentMode, setPaymentMode] = useState('PAID');
  const [exportFormat, setExportFormat] = useState('CSV');
  const [autoManifest, setAutoManifest] = useState(true);
  const [autoInvoice, setAutoInvoice] = useState(false);
  const [mandatoryScanning, setMandatoryScanning] = useState(true);

  const user = useAuthStore((s) => s.user);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const settings = (await settingsService.getUserSettings(user.id)) as OperationalSettings;
      if (settings) {
        setDefaultMode(settings.defaultMode || 'TRUCK');
        setDefaultServiceLevel(settings.defaultServiceLevel || 'STANDARD');
        setPaymentMode(settings.paymentMode || 'PAID');
        setExportFormat(settings.exportFormat || 'CSV');
        setAutoManifest(settings.autoManifest ?? true);
        setAutoInvoice(settings.autoInvoice ?? false);
        setMandatoryScanning(settings.mandatoryScanning ?? true);
      }
    } catch {
      // Use defaults on error
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsBusy(true);
    try {
      await settingsService.updateUserSettings(user.id, {
        defaultMode,
        defaultServiceLevel,
        paymentMode,
        exportFormat,
        autoManifest,
        autoInvoice,
        mandatoryScanning,
      });
      toast.success('Operational defaults saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Truck className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Operational Defaults</CardTitle>
        </div>
        <CardDescription>
          Default values applied when creating shipments and manifests
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} strokeWidth={1.5} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Selects grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="default-mode">Shipment Mode</Label>
                <Select value={defaultMode} onValueChange={setDefaultMode}>
                  <SelectTrigger id="default-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPMENT_MODES.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="service-level">Service Level</Label>
                <Select value={defaultServiceLevel} onValueChange={setDefaultServiceLevel}>
                  <SelectTrigger id="service-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_LEVELS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="export-format">Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger id="export-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSV">CSV (Spreadsheet)</SelectItem>
                    <SelectItem value="PDF">PDF (Document)</SelectItem>
                    <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="flex flex-col gap-2">
              <Label>Default Payment Mode</Label>
              <RadioGroup
                value={paymentMode}
                onValueChange={setPaymentMode}
                className="flex flex-wrap gap-3"
              >
                {PAYMENT_MODES.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer transition-colors',
                      paymentMode === p.id
                        ? 'border-primary/50 bg-primary/5 text-primary'
                        : 'border-border bg-muted/30 hover:border-border/80'
                    )}
                  >
                    <RadioGroupItem value={p.id} id={`pay-${p.id}`} />
                    <Label htmlFor={`pay-${p.id}`} className="cursor-pointer font-normal">
                      {p.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            {/* Auto-behaviour toggles */}
            <div className="flex flex-col gap-4">
              {[
                {
                  id: 'auto-manifest',
                  label: 'Auto-generate Manifests',
                  desc: 'Automatically create manifests for assigned vehicles',
                  checked: autoManifest,
                  onCheckedChange: setAutoManifest,
                },
                {
                  id: 'auto-invoice',
                  label: 'Auto-issue Invoices',
                  desc: 'Trigger invoice generation automatically on delivery',
                  checked: autoInvoice,
                  onCheckedChange: setAutoInvoice,
                },
                {
                  id: 'mandatory-scan',
                  label: 'Mandatory Barcode Scan',
                  desc: 'Require scan for all shipment status transitions',
                  checked: mandatoryScanning,
                  onCheckedChange: setMandatoryScanning,
                },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor={item.id} className="cursor-pointer">
                      {item.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={item.onCheckedChange}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="border-t border-border/40 pt-4 flex justify-end">
        <Button onClick={handleSave} disabled={isBusy}>
          {isBusy ? 'Saving…' : 'Save Defaults'}
        </Button>
      </CardFooter>
    </Card>
  );
}
