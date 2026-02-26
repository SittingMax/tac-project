# TAC Cargo Development Guide

This guide covers development practices, component patterns, and implementation details for the TAC Cargo Enterprise Portal.

---

## Table of Contents

1. [Development Environment](#development-environment)
2. [Component Patterns](#component-patterns)
3. [State Management](#state-management)
4. [Form Handling](#form-handling)
5. [Styling Guide](#styling-guide)
6. [PDF Generation](#pdf-generation)
7. [AI Integration](#ai-integration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Development Environment

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18.x+ | Runtime |
| npm | 9.x+ | Package Manager |
| VS Code | Latest | Recommended IDE |

### VS Code Extensions (Recommended)

- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **TypeScript Importer**
- **Prettier**
- **ESLint**

### Environment Variables

Create a `.env.local` file in the project root:

```env
# OpenRouter API Key (for AI Assistant)
OPENROUTER_API_KEY=your_api_key_here
```

### Development Server

```bash
npm run dev
```

- **Local**: http://localhost:3000
- **Network**: Available on local network (check terminal output)

---

## Component Patterns

### Base UI Components

All base components are in `components/ui/CyberComponents.tsx`:

#### Card

```tsx
import { Card } from '@/components/ui/CyberComponents';

<Card className="custom-class">
  <h2>Card Title</h2>
  <p>Card content here</p>
</Card>
```

#### Button

```tsx
import { Button } from '@/components/ui/CyberComponents';

// Variants: primary, secondary, ghost, danger
// Sizes: sm, md, lg
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="danger" size="sm">
  Delete
</Button>
```

#### Badge

```tsx
import { Badge } from '@/components/ui/CyberComponents';

// Variants: default, outline, neon
<Badge variant="neon">NEW</Badge>
<Badge variant="outline">PENDING</Badge>
```

#### Input

```tsx
import { Input } from '@/components/ui/CyberComponents';

<Input 
  type="text" 
  placeholder="Enter value"
  className="w-full"
/>
```

#### Table Components

```tsx
import { Table, Th, Td } from '@/components/ui/CyberComponents';

<Table>
  <thead>
    <tr>
      <Th>Column 1</Th>
      <Th>Column 2</Th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <Td>Value 1</Td>
      <Td>Value 2</Td>
    </tr>
  </tbody>
</Table>
```

### Page Component Pattern

```tsx
import React, { useEffect } from 'react';
import { Card, Button } from '../components/ui/CyberComponents';
import { useShipmentStore } from '../store/shipmentStore';

export const MyPage: React.FC = () => {
    const { data, isLoading, fetchData } = useShipmentStore();

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Page Title</h1>
                <Button>Action</Button>
            </div>
            
            <Card>
                {/* Page content */}
            </Card>
        </div>
    );
};
```

### Modal Pattern

```tsx
import { Modal } from '../components/ui/Modal';

const [isOpen, setIsOpen] = useState(false);

<Button onClick={() => setIsOpen(true)}>Open Modal</Button>

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal Title">
  <p>Modal content here</p>
  <div className="flex gap-2 mt-4">
    <Button onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="primary" onClick={handleSubmit}>Submit</Button>
  </div>
</Modal>
```

---

## State Management

### Main App Store

Located in `store/index.ts`, handles global app state:

```tsx
import { useStore } from '../store';

const MyComponent = () => {
    const { 
        user,           // Current user object
        isAuthenticated,// Auth status
        theme,          // 'dark' | 'light'
        sidebarCollapsed,
        login,          // (user) => void
        logout,         // () => void
        toggleTheme,    // () => void
        toggleSidebar   // () => void
    } = useStore();
};
```

### Domain Stores

Each domain has its own store with standardized patterns:

```tsx
import { useShipmentStore } from '../store/shipmentStore';

const { 
    shipments,        // Data array
    isLoading,        // Loading state
    fetchShipments,   // Fetch action
    createShipment    // Create action
} = useShipmentStore();
```

### Creating a New Store

```tsx
// store/myStore.ts
import { create } from 'zustand';
import { db } from '../lib/mock-db';

interface MyState {
    items: Item[];
    isLoading: boolean;
    fetchItems: () => void;
    addItem: (item: Partial<Item>) => Promise<void>;
}

export const useMyStore = create<MyState>((set) => ({
    items: [],
    isLoading: false,

    fetchItems: () => {
        set({ isLoading: true });
        setTimeout(() => {
            set({ items: db.getItems(), isLoading: false });
        }, 300);
    },

    addItem: async (itemData) => {
        set({ isLoading: true });
        const newItem = { id: generateId(), ...itemData };
        await simulateNetwork();
        db.addItem(newItem);
        set(state => ({
            items: [newItem, ...state.items],
            isLoading: false
        }));
    }
}));
```

---

## Form Handling

### Using react-hook-form with Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button } from '../components/ui/CyberComponents';

// 1. Define schema
const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    weight: z.number().min(0.1, 'Minimum weight is 0.1 kg'),
});

type FormData = z.infer<typeof formSchema>;

// 2. Use in component
const MyForm = () => {
    const { 
        register, 
        handleSubmit, 
        formState: { errors } 
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            weight: 1
        }
    });

    const onSubmit = (data: FormData) => {
        console.log(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label>Name</label>
                <Input {...register('name')} />
                {errors.name && (
                    <span className="text-red-500 text-sm">
                        {errors.name.message}
                    </span>
                )}
            </div>
            
            <div>
                <label>Email</label>
                <Input {...register('email')} type="email" />
                {errors.email && (
                    <span className="text-red-500 text-sm">
                        {errors.email.message}
                    </span>
                )}
            </div>
            
            <div>
                <label>Weight (kg)</label>
                <Input 
                    {...register('weight', { valueAsNumber: true })} 
                    type="number" 
                    step="0.1"
                />
                {errors.weight && (
                    <span className="text-red-500 text-sm">
                        {errors.weight.message}
                    </span>
                )}
            </div>

            <Button type="submit">Submit</Button>
        </form>
    );
};
```

---

## Styling Guide

### Tailwind CSS v4 Theme

The theme is defined in `index.html` using Tailwind CSS v4 syntax:

```css
@theme {
    --color-cyber-accent: #06b6d4;
    --color-cyber-neon: #22d3ee;
    --color-cyber-purple: #c084fc;
    --color-cyber-success: #10b981;
    --color-cyber-warning: #f59e0b;
    --color-cyber-danger: #ef4444;
}
```

---

## Dashboard Defaults

### Default Time Window (Business Decision)

The dashboard must use an explicit default time window (not an implicit UI default).

- **Source of truth**: `lib/constants.ts` → `DEFAULT_DASHBOARD_TIME_RANGE`


### Using Theme Colors

```tsx
// Background colors
className="bg-cyber-bg"
className="bg-cyber-surface"
className="bg-cyber-card"

// Text colors
className="text-cyber-neon"
className="text-cyber-accent"
className="text-cyber-purple"

// Border colors
className="border-cyber-border"
className="border-cyber-neon/50"

// Status colors
className="text-cyber-success"  // Green
className="text-cyber-warning"  // Orange
className="text-cyber-danger"   // Red
```

### Status Colors Mapping

Use `design-tokens.ts` for consistent status styling:

```tsx
import { STATUS_COLORS } from '../lib/design-tokens';

<span className={STATUS_COLORS[shipment.status]}>
    {shipment.status}
</span>
```

### Utility Function: cn()

Merge Tailwind classes conditionally:

```tsx
import { cn } from '../lib/utils';

<div className={cn(
    "base-classes",
    isActive && "active-classes",
    variant === 'primary' && "primary-classes"
)}>
```

### Dark/Light Mode

The app supports theme switching. Use dark mode variants:

```tsx
className="bg-white dark:bg-cyber-surface"
className="text-slate-900 dark:text-white"
className="border-slate-200 dark:border-cyber-border"
```

---

## PDF Generation

### Shipping Label (4x6 inches)

```tsx
import { generateShipmentLabel } from '../lib/pdf-generator';

const handlePrintLabel = async (shipment: Shipment) => {
    const pdfUrl = await generateShipmentLabel(shipment);
    window.open(pdfUrl, '_blank');
};
```

### Enterprise Invoice (A4)

```tsx
import { generateEnterpriseInvoice } from '../lib/pdf-generator';

const handlePrintInvoice = async (invoice: Invoice) => {
    const pdfUrl = await generateEnterpriseInvoice(invoice);
    window.open(pdfUrl, '_blank');
};
```

### PDF Features

- **Barcodes**: CODE128 format using JsBarcode
- **Custom Fonts**: Helvetica, Helvetica Bold, Courier (built-in)
- **Colors**: Navy blue corporate theme
- **SVG Graphics**: Box illustration in invoices

---

## AI Integration

### OpenRouter API Setup

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Add to `.env.local`:
   ```
   OPENROUTER_API_KEY=your_key_here
   ```

### Using the AI Assistant

```tsx
import { shipmentAssistant } from '../lib/mcp/shipment-server';

const handleQuery = async (userQuestion: string) => {
    const response = await shipmentAssistant.query(userQuestion);
    console.log(response);
};

// Example queries:
// "What is the status of shipment TAC12345678?"
// "How many shipments are in transit?"
// "List all open exceptions"
```

### How It Works

The `ShipmentAssistant` class:
1. Fetches real-time data from the mock database
2. Builds a context with shipments, exceptions, and manifests
3. Sends the context + user query to OpenRouter
4. Returns a natural language response

---

## Testing

### Manual Testing Checklist

#### Authentication
- [ ] Login with mock credentials
- [ ] Protected routes redirect to login
- [ ] Logout clears session
- [ ] RBAC restricts access by role

#### Shipments
- [ ] Create new shipment
- [ ] View shipment list
- [ ] Search by AWB
- [ ] View shipment details
- [ ] Print shipping label

#### Invoices
- [ ] Create invoice from shipment
- [ ] View invoice list
- [ ] Print PDF invoice
- [ ] Update invoice status

#### Manifests
- [ ] Create new manifest
- [ ] Add shipments to manifest
- [ ] Mark manifest as departed
- [ ] Mark manifest as arrived

---

## Troubleshooting

### Common Issues

#### "Missing ./v4/core specifier in zod package"

**Cause**: Version mismatch between `@hookform/resolvers` and `zod`.

**Solution**: Use compatible versions:
```json
{
  "zod": "3.23.8",
  "@hookform/resolvers": "3.9.0"
}
```

#### Build fails with import errors

**Cause**: Mismatched versions in `package.json` vs `index.html` importmap.

**Solution**: Ensure versions match in both files.

#### Dark mode not working

**Cause**: Missing `dark` class on `<html>` element.

**Solution**: The theme is controlled by `useStore().theme`. Check `App.tsx` applies the class:
```tsx
useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}, [theme]);
```

#### LocalStorage data corrupted

**Solution**: Clear localStorage and reload:
```javascript
localStorage.removeItem('tac_cargo_db_v1');
location.reload();
```

### Debug Tools

#### Logger

```tsx
import { logger } from '../lib/logger';

logger.info('Action completed', { data });
logger.warn('Warning message');
logger.error('Error occurred', error);
logger.debug('Debug info');
```

#### View Audit Logs

```tsx
import { useAuditStore } from '../store/auditStore';

const { logs, fetchLogs } = useAuditStore();
useEffect(() => { fetchLogs(); }, []);
console.log(logs);
```

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search (when in dashboard) |
| `Escape` | Close modal |

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance Tips

1. Use `React.memo()` for expensive list items
2. Lazy load pages with `React.lazy()`
3. Minimize re-renders by splitting state
4. Use `useMemo` for computed values

---

*Last updated: January 2026*
