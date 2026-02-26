# TAC Cargo Enterprise Portal

> **Tapan Associate Cargo** - A comprehensive logistics management platform for cargo operations between Imphal and New Delhi hubs.

![Version](https://img.shields.io/badge/version-0.0.0-blue)
![React](https://img.shields.io/badge/React-19.0.0--rc-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Project Structure](#project-structure)
6. [Architecture](#architecture)
7. [API Reference](#api-reference)
8. [Contributing](#contributing)

---

## Overview

TAC Cargo Enterprise Portal is a modern, React-based logistics management system designed for cargo operations. The platform provides end-to-end visibility and control over:

- **Shipment Management** - Create, track, and manage cargo shipments
- **Manifest Operations** - Group shipments for linehaul transport
- **Invoice Generation** - Automated billing with PDF generation
- **Exception Handling** - Track and resolve delivery exceptions
- **Analytics & Reporting** - Real-time KPIs and business insights

### Hub Network

| Hub Code | Location | Address |
|----------|----------|---------|
| **IMF** | Imphal | Tulihal Airport Road, Imphal, Manipur 795001 |
| **DEL** | New Delhi | Cargo Terminal 3, IGI Airport, New Delhi 110037 |

---

## Features

### Core Modules

| Module | Description | Access |
|--------|-------------|--------|
| **Dashboard** | Real-time KPIs, shipment status overview | All users |
| **Analytics** | Charts, trends, performance metrics | Admin, Manager, Finance |
| **Shipments** | Create/view/track shipments | All users |
| **Tracking** | AWB lookup and timeline view | All users |
| **Manifests** | Create manifests, assign shipments | Admin, Manager, Ops |
| **Scanning** | Barcode/QR scanning for operations | Admin, Manager, Warehouse |
| **Inventory** | Package location management | Admin, Manager, Warehouse |
| **Exceptions** | Report and resolve exceptions | Admin, Manager, Ops, Warehouse |
| **Finance** | Invoicing and billing | Admin, Manager, Finance |
| **Customers** | Customer database management | Admin, Manager, Finance, Ops |
| **Management** | User administration | Admin, Manager |
| **Settings** | App configuration | All users |

### Key Capabilities

- **Role-Based Access Control (RBAC)** - Five user roles with granular permissions
- **Dark/Light Theme** - Toggle between cyber-futuristic dark mode and clean light mode
- **PDF Generation** - Shipping labels (4x6) and enterprise invoices (A4)

- **Real-time State** - Zustand-based reactive state management
- **Offline-First** - localStorage persistence for mock database

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0-rc | UI Framework |
| TypeScript | 5.8.x | Type Safety |
| Vite | 6.2.x | Build Tool |
| Tailwind CSS | v4 (CDN) | Styling |
| React Router | 6.30.3 | Routing |
| Zustand | 5.0.0 | State Management |
| Recharts | 2.15.0 | Charts & Graphs |
| Framer Motion | 10.16.4 | Animations |
| GSAP | 3.14.x | Advanced Animations |

### Forms & Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| react-hook-form | 7.52.1 | Form Management |
| @hookform/resolvers | 3.9.0 | Validation Integration |
| Zod | 3.23.8 | Schema Validation |

### PDF & Barcodes

| Technology | Version | Purpose |
|------------|---------|---------|
| pdf-lib | 1.17.1 | PDF Generation |
| JsBarcode | 3.11.6 | Barcode Generation |
| qrcode | 1.5.3 | QR Code Generation |
| qrcode.react | 3.1.0 | QR React Component |

### Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| date-fns | 3.6.0 | Date Formatting |
| clsx | 2.1.1 | Conditional Classes |
| tailwind-merge | 2.4.0 | Tailwind Class Merging |
| uuid | 10.0.0 | ID Generation |
| lucide-react | 0.469.0 | Icons |



---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher


### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tac-portal

# Install dependencies
npm install



# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

### Default Credentials

For demo purposes, use any credentials on the login screen. The mock login accepts:
- **Email**: `admin@taccargo.com`
- **Password**: `password`

---

## Project Structure

```
tac-portal/
├── App.tsx                     # Main app component with routing
├── index.tsx                   # React entry point
├── index.html                  # HTML template with Tailwind config
├── types.ts                    # TypeScript interfaces and enums
├── vite.config.ts              # Vite configuration
├── package.json                # Dependencies and scripts
├── .env.local                  # Environment variables
│
├── components/                 # Reusable UI components
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── Charts.tsx          # Chart visualizations
│   │   └── KPIGrid.tsx         # KPI display cards
│   ├── finance/                # Finance module components
│   │   └── CreateInvoiceForm.tsx
│   ├── layout/                 # Layout components
│   │   ├── Header.tsx          # Top navigation bar
│   │   └── Sidebar.tsx         # Side navigation with RBAC
│   ├── manifests/              # Manifest components
│   │   └── CreateManifestForm.tsx
│   ├── shipments/              # Shipment components
│   │   ├── CreateShipmentForm.tsx
│   │   └── ShipmentDetails.tsx
│   └── ui/                     # Base UI components
│       ├── CyberComponents.tsx # Card, Badge, Button, Input, Table
│       ├── Modal.tsx           # Modal dialog
│       └── tracker-card.tsx    # Tracking visualization
│
├── pages/                      # Page components (routes)
│   ├── Landing.tsx             # Public landing page
│   ├── Dashboard.tsx           # Main dashboard
│   ├── Analytics.tsx           # Analytics & charts
│   ├── Shipments.tsx           # Shipment management
│   ├── Tracking.tsx            # AWB tracking
│   ├── Manifests.tsx           # Manifest management
│   ├── Scanning.tsx            # Barcode scanning
│   ├── Inventory.tsx           # Inventory management
│   ├── Exceptions.tsx          # Exception handling
│   ├── Finance.tsx             # Invoicing
│   ├── Customers.tsx           # Customer management
│   ├── Management.tsx          # User management
│   └── Settings.tsx            # App settings
│
├── store/                      # Zustand state stores
│   ├── index.ts                # Main app store (auth, theme)
│   ├── shipmentStore.ts        # Shipment state
│   ├── manifestStore.ts        # Manifest state
│   ├── invoiceStore.ts         # Invoice state
│   ├── exceptionStore.ts       # Exception state
│   ├── managementStore.ts      # User management state
│   └── auditStore.ts           # Audit log state
│
├── lib/                        # Utility functions and services
│   ├── constants.ts            # Static data (hubs, states, cities)
│   ├── design-tokens.ts        # Status colors, animations
│   ├── logger.ts               # Logging utility
│   ├── mock-db.ts              # localStorage mock database
│   ├── pdf-generator.ts        # PDF generation (labels, invoices)
│   ├── utils.ts                # Helper functions
│   └── mcp/                    # AI/MCP integration (OpenRouter)
│
├── docs/                       # Documentation
│   ├── README.md               # This file
│   └── ENTERPRISE_PLATFORM_PRD.md
│
└── backup/                     # Previous version backup
```

---

## Architecture

### State Management

The application uses **Zustand** for state management with separate stores for different domains:

```
┌─────────────────────────────────────────────────────────┐
│                      App Store                          │
│  (auth, theme, navigation, sidebar state)               │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                   Domain Stores                         │
├─────────────┬─────────────┬─────────────┬──────────────┤
│ Shipment    │  Manifest   │  Invoice    │  Exception   │
│ Store       │  Store      │  Store      │  Store       │
└─────────────┴─────────────┴─────────────┴──────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                    Mock Database                        │
│           (localStorage persistence)                    │
└─────────────────────────────────────────────────────────┘
```

### Routing Structure

```
/ ─────────────────────── Landing (public)
├── /login ────────────── Login
├── /dashboard ─────────── Dashboard (protected)
├── /analytics ─────────── Analytics (Admin, Manager, Finance)
├── /shipments ─────────── Shipments (protected)
├── /tracking ──────────── Tracking (protected)
├── /manifests ─────────── Manifests (Admin, Manager, Ops)
├── /scanning ──────────── Scanning (Admin, Manager, Warehouse)
├── /inventory ─────────── Inventory (Admin, Manager, Warehouse)
├── /exceptions ────────── Exceptions (Admin, Manager, Ops, Warehouse)
├── /finance ───────────── Finance (Admin, Manager, Finance)
├── /customers ─────────── Customers (Admin, Manager, Finance, Ops)
├── /management ────────── Management (Admin, Manager)
└── /settings ──────────── Settings (protected)
```

### User Roles & Permissions

| Role | Dashboard | Analytics | Shipments | Manifests | Scanning | Finance | Management |
|------|-----------|-----------|-----------|-----------|----------|---------|------------|
| ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| MANAGER | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| FINANCE_STAFF | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| OPS_STAFF | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| WAREHOUSE_STAFF | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |

---

## API Reference

### Domain Models

#### Shipment

```typescript
interface Shipment {
    id: string;              // Internal ID
    awb: string;             // Air Waybill number (TAC########)
    customerId: string;
    customerName: string;
    originHub: HubLocation;  // 'IMPHAL' | 'NEW_DELHI'
    destinationHub: HubLocation;
    mode: ShipmentMode;      // 'AIR' | 'TRUCK'
    serviceLevel: ServiceLevel; // 'STANDARD' | 'EXPRESS'
    totalPackageCount: number;
    totalWeight: {
        dead: number;
        volumetric: number;
        chargeable: number;
    };
    status: ShipmentStatus;
    invoiceId?: string;
    manifestId?: string;
    createdAt: string;
    updatedAt: string;
    eta: string;
    consignor?: ContactInfo;
    consignee?: ContactInfo;
    contentsDescription?: string;
    declaredValue?: number;
    paymentMode?: PaymentMode; // 'PAID' | 'TO_PAY' | 'TBB'
}
```

#### Shipment Status Flow

```
CREATED
    │
    ▼
PICKUP_SCHEDULED
    │
    ▼
PICKED_UP
    │
    ▼
RECEIVED_AT_ORIGIN
    │
    ▼
IN_TRANSIT
    │
    ▼
RECEIVED_AT_DEST
    │
    ▼
OUT_FOR_DELIVERY
    │
    ▼
DELIVERED ◄───────────────────────────┐
                                      │
           EXCEPTION ◄────────────────┘
```

#### Invoice

```typescript
interface Invoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    shipmentId: string;
    awb: string;
    status: InvoiceStatus; // 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'OVERDUE'
    paymentMode: PaymentMode;
    financials: {
        ratePerKg: number;
        baseFreight: number;
        docketCharge: number;
        pickupCharge: number;
        packingCharge: number;
        fuelSurcharge: number;
        handlingFee: number;
        insurance: number;
        tax: {
            cgst: number;
            sgst: number;
            igst: number;
            total: number;
        };
        discount: number;
        totalAmount: number;
        advancePaid: number;
        balance: number;
    };
    dueDate: string;
    paidAt?: string;
    createdAt: string;
}
```

#### Manifest

```typescript
interface Manifest {
    id: string;
    reference: string;
    type: ShipmentMode;
    originHub: HubLocation;
    destinationHub: HubLocation;
    status: ManifestStatus; // 'OPEN' | 'CLOSED' | 'DEPARTED' | 'ARRIVED'
    vehicleMeta: {
        vehicleId?: string;
        driverName?: string;
        driverPhone?: string;
        flightNumber?: string;
        carrier?: string;
    };
    shipmentIds: string[];
    shipmentCount: number;
    totalWeight: number;
    createdBy: string;
    createdAt: string;
    departedAt?: string;
    arrivedAt?: string;
}
```

### Utility Functions

#### `calculateFreight(weight, mode, service)`

Calculates freight charges based on weight, transport mode, and service level.

```typescript
const charges = calculateFreight(10, 'AIR', 'EXPRESS');
// Returns: { baseFreight, fuelSurcharge, tax, totalAmount, ... }
```

#### `formatCurrency(amount)`

Formats a number as Indian Rupees.

```typescript
formatCurrency(1500); // "₹1,500.00"
```

#### `isValidTransition(current, next)`

Validates if a shipment status transition is allowed.

```typescript
isValidTransition('PICKED_UP', 'RECEIVED_AT_ORIGIN'); // true
isValidTransition('DELIVERED', 'IN_TRANSIT'); // false
```

---

## Contributing

### Development Workflow

1. Create a feature branch from `main`
2. Make changes following the code style
3. Test locally with `npm run dev`
4. Build to verify no errors: `npm run build`
5. Submit a pull request

### Code Style

- **TypeScript** - Use strict typing, avoid `any`
- **Components** - Functional components with hooks
- **Styling** - Tailwind CSS classes, use `cn()` for conditionals
- **State** - Zustand stores for domain state
- **Forms** - react-hook-form with Zod validation

---

## License

Proprietary - TAC Cargo Enterprise © 2024
