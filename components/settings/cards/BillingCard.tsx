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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { settingsService } from '@/lib/services/settingsService';
import { useAuthStore } from '@/store/authStore';

interface BillingSettings {
  gst?: string;
  prefix?: string;
  format?: string;
  allowManualEdit?: boolean;
  autoSend?: boolean;
}

export function BillingCard() {
  const [gst, setGst] = useState('18');
  const [prefix, setPrefix] = useState('INV-TAC-');
  const [format, setFormat] = useState('YYYYMMDD-SEQ');
  const [allowManualEdit, setAllowManualEdit] = useState(false);
  const [autoSend, setAutoSend] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const user = useAuthStore((s) => s.user);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const settings = (await settingsService.getUserSettings(user.id)) as BillingSettings;
      if (settings) {
        setGst(settings.gst || '18');
        setPrefix(settings.prefix || 'INV-TAC-');
        setFormat(settings.format || 'YYYYMMDD-SEQ');
        setAllowManualEdit(settings.allowManualEdit ?? false);
        setAutoSend(settings.autoSend ?? true);
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
        gst,
        prefix,
        format,
        allowManualEdit,
        autoSend,
      });
      toast.success('Billing configuration saved');
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
          <Receipt className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Billing Settings</CardTitle>
        </div>
        <CardDescription>Invoice generation, prefixes, and tax defaults</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} strokeWidth={1.5} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gst">Default GST (%)</Label>
                <Input
                  id="gst"
                  type="number"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  min={0}
                  max={100}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-prefix">Invoice Prefix</Label>
                <Input
                  id="inv-prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="col-span-full flex flex-col gap-1.5">
                <Label htmlFor="inv-format">Invoice Number Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="inv-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYYMMDD-SEQ">INV-TAC-YYYYMMDD-0001</SelectItem>
                    <SelectItem value="YYYY-SEQ">INV-TAC-2026-0001</SelectItem>
                    <SelectItem value="SEQ">INV-TAC-000001</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="manual-edit" className="cursor-pointer">
                    Allow Manual Edit
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Permit agents to override invoice totals
                  </p>
                </div>
                <Switch
                  id="manual-edit"
                  checked={allowManualEdit}
                  onCheckedChange={setAllowManualEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="auto-send" className="cursor-pointer">
                    Auto Send Invoice
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Email invoices to clients automatically on generation
                  </p>
                </div>
                <Switch id="auto-send" checked={autoSend} onCheckedChange={setAutoSend} />
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="border-t border-border/40 pt-4 flex justify-end">
        <Button onClick={handleSave} disabled={isBusy}>
          {isBusy ? 'Saving…' : 'Save Billing'}
        </Button>
      </CardFooter>
    </Card>
  );
}
