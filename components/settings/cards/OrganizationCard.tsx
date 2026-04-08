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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { settingsService } from '@/lib/services/settingsService';
import { toast } from 'sonner';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
];

const CURRENCIES = [
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

export function OrganizationCard() {
  const [isBusy, setIsBusy] = useState(false);
  const [terminalName, setTerminalName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  const load = useCallback(async () => {
    setIsBusy(true);
    try {
      const { name, settings } = await settingsService.getOrgSettings();
      const s = settings as Record<string, unknown>;
      setTerminalName(name || '');
      setTimezone(typeof s.timezone === 'string' ? s.timezone : 'Asia/Kolkata');
      setCurrency(typeof s.currency === 'string' ? s.currency : 'INR');
      setDateFormat(typeof s.dateFormat === 'string' ? s.dateFormat : 'DD/MM/YYYY');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load organization profile');
    } finally {
      setIsBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setIsBusy(true);
    try {
      await settingsService.updateOrgSettings(terminalName, { timezone, currency, dateFormat });
      toast.success('Organization profile saved');
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
          <Building2 className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Organization Profile</CardTitle>
        </div>
        <CardDescription>Manage terminal identity and regional configuration</CardDescription>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 gap-4">
        <div className="col-span-full flex flex-col gap-1.5">
          <Label htmlFor="terminal-name">Terminal Name</Label>
          <Input
            id="terminal-name"
            value={terminalName}
            onChange={(e) => setTerminalName(e.target.value)}
            disabled={isBusy}
            placeholder="e.g. Imphal Hub"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone} disabled={isBusy}>
            <SelectTrigger id="timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currency} onValueChange={setCurrency} disabled={isBusy}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date-format">Date Format</Label>
          <Select value={dateFormat} onValueChange={setDateFormat} disabled={isBusy}>
            <SelectTrigger id="date-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/40 pt-4 flex justify-end">
        <Button onClick={handleSave} disabled={isBusy}>
          {isBusy ? 'Saving…' : 'Save Profile'}
        </Button>
      </CardFooter>
    </Card>
  );
}
