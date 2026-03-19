'use client';

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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShieldAlert, KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

// ── Purely informational row (read-only managed status) ─────────────────────
function PolicyRow({
  label,
  description,
  badge,
}: {
  label: string;
  description: string;
  badge: { text: string; variant: 'outline' | 'secondary' | 'default' };
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Badge variant={badge.variant}>{badge.text}</Badge>
    </div>
  );
}

export function SecurityCard() {
  const [reqSpecial, setReqSpecial] = useState(true);
  const [noReuse, setNoReuse] = useState(true);
  const [minLength, setMinLength] = useState('12');
  const [expiry, setExpiry] = useState('90');
  const [twoFA, setTwoFA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [rateLimit, setRateLimit] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const handleSave = async () => {
    setIsBusy(true);
    await new Promise((r) => setTimeout(r, 400));
    toast.success('Security policies updated');
    setIsBusy(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Password Policy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Password Policy</CardTitle>
          </div>
          <CardDescription>Complexity and rotation rules for user passwords</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="min-length">Minimum Length</Label>
              <Select value={minLength} onValueChange={setMinLength}>
                <SelectTrigger id="min-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 Characters</SelectItem>
                  <SelectItem value="10">10 Characters</SelectItem>
                  <SelectItem value="12">12 Characters (Recommended)</SelectItem>
                  <SelectItem value="16">16 Characters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expiry">Password Expiry</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id="expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="180">180 Days</SelectItem>
                  <SelectItem value="0">Never Expires</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="req-special" className="cursor-pointer">
                  Require Special Characters
                </Label>
                <p className="text-xs text-muted-foreground">
                  Must contain at least one symbol (!@#$%)
                </p>
              </div>
              <Switch id="req-special" checked={reqSpecial} onCheckedChange={setReqSpecial} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="no-reuse" className="cursor-pointer">
                  Prevent Password Reuse
                </Label>
                <p className="text-xs text-muted-foreground">Cannot reuse the last 5 passwords</p>
              </div>
              <Switch id="no-reuse" checked={noReuse} onCheckedChange={setNoReuse} />
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/40 pt-4 flex justify-end">
          <Button onClick={handleSave} disabled={isBusy}>
            {isBusy ? 'Saving…' : 'Update Policy'}
          </Button>
        </CardFooter>
      </Card>

      {/* Authentication & Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Authentication & Sessions</CardTitle>
          </div>
          <CardDescription>Two-factor authentication and session management</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="two-fa" className="cursor-pointer flex items-center gap-2">
                <ShieldAlert className="size-4 text-primary" />
                Two-Factor Authentication
              </Label>
              <p className="text-xs text-muted-foreground">
                Require all users to enrol with an authenticator app
              </p>
            </div>
            <Switch id="two-fa" checked={twoFA} onCheckedChange={setTwoFA} />
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="session-timeout">Idle Timeout</Label>
              <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                <SelectTrigger id="session-timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="60">1 Hour</SelectItem>
                  <SelectItem value="240">4 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="rate-limit" className="cursor-pointer">
                Login Rate Limiting
              </Label>
              <p className="text-xs text-muted-foreground">
                Lock accounts after 5 failed attempts for 15 minutes
              </p>
            </div>
            <Switch id="rate-limit" checked={rateLimit} onCheckedChange={setRateLimit} />
          </div>

          <Separator />

          {/* Read-only infra status rows */}
          <div className="flex flex-col gap-4">
            <PolicyRow
              label="MFA Infrastructure"
              description="Identity Provider Managed"
              badge={{ text: 'Managed', variant: 'outline' }}
            />
            <PolicyRow
              label="API Access Gateway"
              description="Privileged access only"
              badge={{ text: 'Restricted', variant: 'outline' }}
            />
            <PolicyRow
              label="Policy Enforcement"
              description="8+ chars / breach protection"
              badge={{ text: 'Active', variant: 'secondary' }}
            />
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/40 pt-4 flex justify-between">
          <Button variant="outline" onClick={() => toast.info('All active sessions revoked')}>
            Revoke All Sessions
          </Button>
          <Button onClick={handleSave} disabled={isBusy}>
            {isBusy ? 'Saving…' : 'Save Session Rules'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
