/**
 * Dev UI Kit Route
 * Internal component documentation and preview
 * Access: /dev/ui-kit (ADMIN only)
 */

import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Skeleton,
  KPICardSkeleton,
  KPIGridSkeleton,
  ChartSkeleton,
  TableSkeleton,
  PageHeaderSkeleton,
} from '../components/ui/skeleton';
import { StatusBadge } from '../components/domain/StatusBadge';
import { Package, Truck, AlertTriangle, Check, X, Info, Search } from 'lucide-react';
import {
  playSuccessFeedback,
  playErrorFeedback,
  playWarningFeedback,
  playInfoFeedback,
  playManifestActivatedFeedback,
  playManifestClosedFeedback,
} from '../lib/feedback';

type Section =
  | 'buttons'
  | 'badges'
  | 'inputs'
  | 'cards'
  | 'skeletons'
  | 'feedback'
  | 'colors'
  | 'status'
  | 'scanner';

export const DevUIKit: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('buttons');

  const sections: { id: Section; label: string }[] = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'badges', label: 'Badges' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'cards', label: 'Cards' },
    { id: 'skeletons', label: 'Skeletons' },
    { id: 'feedback', label: 'Audio/Haptic' },
    { id: 'colors', label: 'Color Tokens' },
    { id: 'status', label: 'Status Badges' },
    { id: 'scanner', label: 'Scanner Debug' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">WGS Portal UI Kit</h1>
          <p className="text-muted-foreground">Internal component documentation and preview</p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-border">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </Button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeSection === 'buttons' && <ButtonsSection />}
          {activeSection === 'badges' && <BadgesSection />}
          {activeSection === 'inputs' && <InputsSection />}
          {activeSection === 'cards' && <CardsSection />}
          {activeSection === 'skeletons' && <SkeletonsSection />}
          {activeSection === 'feedback' && <FeedbackSection />}
          {activeSection === 'colors' && <ColorsSection />}
          {activeSection === 'status' && <StatusSection />}
          {activeSection === 'scanner' && <ScannerDebugSection />}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-bold text-foreground mb-4">{children}</h2>
);

const ComponentGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-wrap gap-4 items-center">{children}</div>
);

const ButtonsSection: React.FC = () => (
  <div className="space-y-8">
    <Card>
      <SectionTitle>Button Variants</SectionTitle>
      <ComponentGrid>
        <Button variant="default">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Danger</Button>
      </ComponentGrid>
    </Card>

    <Card>
      <SectionTitle>Button Sizes</SectionTitle>
      <ComponentGrid>
        <Button size="sm">Small</Button>
        <Button>Medium</Button>
        <Button size="lg">Large</Button>
      </ComponentGrid>
    </Card>

    <Card>
      <SectionTitle>Button States</SectionTitle>
      <ComponentGrid>
        <Button>Default</Button>
        <Button disabled>Disabled</Button>
        <Button className="animate-pulse">Loading...</Button>
      </ComponentGrid>
    </Card>

    <Card>
      <SectionTitle>Buttons with Icons</SectionTitle>
      <ComponentGrid>
        <Button>
          <Package className="w-4 h-4" /> Create Shipment
        </Button>
        <Button variant="secondary">
          <Truck className="w-4 h-4" /> Manifests
        </Button>
        <Button variant="destructive">
          <AlertTriangle className="w-4 h-4" /> Exception
        </Button>
      </ComponentGrid>
    </Card>
  </div>
);

const BadgesSection: React.FC = () => (
  <div className="space-y-8">
    <Card>
      <SectionTitle>Badge Variants</SectionTitle>
      <ComponentGrid>
        <Badge variant="default">Default</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="secondary">Neon</Badge>
      </ComponentGrid>
    </Card>
  </div>
);

const InputsSection: React.FC = () => (
  <div className="space-y-8">
    <Card>
      <SectionTitle>Input States</SectionTitle>
      <div className="space-y-4 max-w-md">
        <Input placeholder="Default input" />
        <Input placeholder="Disabled input" disabled />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10" />
        </div>
      </div>
    </Card>
  </div>
);

const CardsSection: React.FC = () => (
  <div className="space-y-8">
    <Card>
      <SectionTitle>Card Component</SectionTitle>
      <p className="text-muted-foreground">The base Card component with cyber styling.</p>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-none bg-primary/10">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold">Shipments</span>
        </div>
        <p className="text-2xl font-bold">1,234</p>
        <p className="text-sm text-muted-foreground">Active this month</p>
      </Card>
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-none bg-chart-2/10">
            <Truck className="w-5 h-5 text-chart-2" />
          </div>
          <span className="font-semibold">In Transit</span>
        </div>
        <p className="text-2xl font-bold">89</p>
        <p className="text-sm text-muted-foreground">Currently moving</p>
      </Card>
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-none bg-destructive/10">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <span className="font-semibold">Exceptions</span>
        </div>
        <p className="text-2xl font-bold">12</p>
        <p className="text-sm text-muted-foreground">Requires attention</p>
      </Card>
    </div>
  </div>
);

const SkeletonsSection: React.FC = () => (
  <div className="space-y-8">
    <Card>
      <SectionTitle>Base Skeleton</SectionTitle>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </Card>

    <Card>
      <SectionTitle>KPI Card Skeleton</SectionTitle>
      <div className="max-w-xs">
        <KPICardSkeleton />
      </div>
    </Card>

    <Card>
      <SectionTitle>KPI Grid Skeleton</SectionTitle>
      <KPIGridSkeleton />
    </Card>

    <Card>
      <SectionTitle>Chart Skeleton</SectionTitle>
      <ChartSkeleton height={200} />
    </Card>

    <Card>
      <SectionTitle>Table Skeleton</SectionTitle>
      <TableSkeleton rows={3} columns={4} />
    </Card>

    <Card>
      <SectionTitle>Page Header Skeleton</SectionTitle>
      <PageHeaderSkeleton />
    </Card>
  </div>
);

const FeedbackSection: React.FC = () => (
  <div className="space-y-8">
    <Card>
      <SectionTitle>Audio & Haptic Feedback</SectionTitle>
      <p className="text-muted-foreground mb-4">
        Click buttons to test audio beeps and haptic vibration (on supported devices).
      </p>
      <ComponentGrid>
        <Button onClick={playSuccessFeedback} variant="default">
          <Check className="w-4 h-4" /> Success
        </Button>
        <Button onClick={playErrorFeedback} variant="destructive">
          <X className="w-4 h-4" /> Error
        </Button>
        <Button onClick={playWarningFeedback} variant="secondary">
          <AlertTriangle className="w-4 h-4" /> Warning
        </Button>
        <Button onClick={playInfoFeedback} variant="ghost">
          <Info className="w-4 h-4" /> Info
        </Button>
      </ComponentGrid>
    </Card>

    <Card>
      <SectionTitle>Manifest Feedback</SectionTitle>
      <ComponentGrid>
        <Button onClick={playManifestActivatedFeedback} variant="default">
          Manifest Activated (ascending)
        </Button>
        <Button onClick={playManifestClosedFeedback} variant="secondary">
          Manifest Closed (descending)
        </Button>
      </ComponentGrid>
    </Card>
  </div>
);

const ColorsSection: React.FC = () => {
  const colorTokens = [
    { name: 'Background', var: 'bg-background', text: 'text-foreground' },
    { name: 'Foreground', var: 'bg-foreground', text: 'text-background' },
    { name: 'Card', var: 'bg-card', text: 'text-card-foreground' },
    { name: 'Primary', var: 'bg-primary', text: 'text-primary-foreground' },
    { name: 'Secondary', var: 'bg-secondary', text: 'text-secondary-foreground' },
    { name: 'Muted', var: 'bg-muted', text: 'text-muted-foreground' },
    { name: 'Accent', var: 'bg-accent', text: 'text-accent-foreground' },
    { name: 'Destructive', var: 'bg-destructive', text: 'text-destructive-foreground' },
  ];

  const chartColors = [
    { name: 'Chart 1', var: 'bg-chart-1' },
    { name: 'Chart 2', var: 'bg-chart-2' },
    { name: 'Chart 3', var: 'bg-chart-3' },
    { name: 'Chart 4', var: 'bg-chart-4' },
    { name: 'Chart 5', var: 'bg-chart-5' },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <SectionTitle>Semantic Color Tokens</SectionTitle>
        <p className="text-muted-foreground mb-4">
          Use these tokens instead of hardcoded slate/gray colors for consistency.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colorTokens.map((token) => (
            <div key={token.name} className="space-y-2">
              <div
                className={`${token.var} ${token.text} p-4 rounded-none text-center font-medium`}
              >
                {token.name}
              </div>
              <p className="text-xs text-muted-foreground text-center font-mono">{token.var}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Chart Colors</SectionTitle>
        <div className="flex gap-4">
          {chartColors.map((color) => (
            <div key={color.name} className="space-y-2">
              <div className={`${color.var} w-16 h-16 rounded-none`} />
              <p className="text-xs text-muted-foreground text-center font-mono">{color.name}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Usage Examples</SectionTitle>
        <div className="bg-muted/50 rounded-none p-4 font-mono text-sm space-y-2">
          <p className="text-muted-foreground">// ❌ Avoid hardcoded colors</p>
          <code className="text-destructive block">
            {'className="text-'}
            {'slate-500 dark:text-'}
            {'slate-400"'}
          </code>
          <p className="text-muted-foreground mt-4">// ✅ Preferred semantic tokens</p>
          <code className="text-green-500 block">{'className="text-muted-foreground"'}</code>
        </div>
      </Card>
    </div>
  );
};

const StatusSection: React.FC = () => {
  const shipmentStatuses = [
    'CREATED',
    'PICKUP_SCHEDULED',
    'PICKED_UP',
    'RECEIVED_AT_ORIGIN',
    'IN_TRANSIT',
    'RECEIVED_AT_DEST',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'EXCEPTION',
    'CANCELLED',
    'RTO',
  ];

  const manifestStatuses = ['OPEN', 'CLOSED', 'DEPARTED', 'ARRIVED'];
  const invoiceStatuses = ['DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'OVERDUE'];

  return (
    <div className="space-y-8">
      <Card>
        <SectionTitle>Shipment Status Badges</SectionTitle>
        <ComponentGrid>
          {shipmentStatuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </ComponentGrid>
      </Card>

      <Card>
        <SectionTitle>Manifest Status Badges</SectionTitle>
        <ComponentGrid>
          {manifestStatuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </ComponentGrid>
      </Card>

      <Card>
        <SectionTitle>Invoice Status Badges</SectionTitle>
        <ComponentGrid>
          {invoiceStatuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </ComponentGrid>
      </Card>
    </div>
  );
};

export default DevUIKit;

// ============================================================================
// SCANNER DEBUG SECTION
// ============================================================================

const ScannerDebugSection: React.FC = () => {
  const [logs, setLogs] = useState<
    { key: string; time: number; diff: number; isScanner: boolean }[]
  >([]);
  const lastTimeRef = React.useRef(0);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const diff = lastTimeRef.current ? now - lastTimeRef.current : 0;

      // Heuristic matching the provider
      const isScanner = diff < 100 && diff > 0;

      setLogs((prev) => {
        const newLogs = [{ key: e.key, time: now, diff, isScanner }, ...prev];
        return newLogs.slice(0, 50); // Keep last 50
      });
      lastTimeRef.current = now;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return (
    <div className="space-y-8">
      <Card>
        <SectionTitle>Scanner Input Debugger</SectionTitle>
        <p className="text-muted-foreground mb-4">
          Focus anywhere on this page and scan/type. This logger intercepts events globally (capture
          phase).
          <br />
          <span className="text-xs font-mono bg-muted px-1 rounded-none">
            Threshold: &lt; 100ms
          </span>
        </p>

        <div className="border rounded-none overflow-hidden">
          <div className="bg-muted px-4 py-2 grid grid-cols-12 text-xs font-medium text-muted-foreground">
            <div className="col-span-2">Key</div>
            <div className="col-span-3">Time</div>
            <div className="col-span-3">Diff (ms)</div>
            <div className="col-span-4">Likely Scanner?</div>
          </div>
          <div className="max-h-[400px] overflow-y-auto bg-card">
            {logs.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Waiting for input...
              </div>
            )}
            {logs.map((log, i) => (
              <div
                key={log.time + i}
                className="px-4 py-2 grid grid-cols-12 text-sm border-t border-border/50 font-mono"
              >
                <div className="col-span-2 text-foreground font-bold">
                  {log.key === ' ' ? 'Space' : log.key}
                </div>
                <div className="col-span-3 text-muted-foreground">
                  {new Date(log.time).toLocaleTimeString().split(' ')[0]}.
                  {Math.floor(log.time % 1000)}
                </div>
                <div
                  className={`col-span-3 ${log.diff < 100 ? 'text-green-500 font-bold' : 'text-yellow-500'}`}
                >
                  {log.diff}ms
                </div>
                <div className="col-span-4">
                  {log.isScanner ? (
                    <Badge
                      variant="default"
                      className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-0"
                    >
                      YES
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">
                      NO
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setLogs([])}>
            Clear Log
          </Button>
        </div>
      </Card>
    </div>
  );
};
