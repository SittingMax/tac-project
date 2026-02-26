import React, { lazy } from 'react';
import { UserRole } from '@/types';

// Lazy Load Pages
const Landing = lazy(() => import('@/pages/LandingPage').then((module) => ({ default: module.Landing })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Shipments = lazy(() => import('@/pages/Shipments').then((module) => ({ default: module.Shipments })));
const ShipmentDetailsPage = lazy(() => import('@/pages/ShipmentDetailsPage').then((module) => ({ default: module.ShipmentDetailsPage })));
const Finance = lazy(() => import('@/pages/Finance').then((module) => ({ default: module.Finance })));
const Analytics = lazy(() => import('@/pages/Analytics').then((module) => ({ default: module.Analytics })));
const Tracking = lazy(() => import('@/pages/Tracking').then((module) => ({ default: module.Tracking })));
const Manifests = lazy(() => import('@/pages/Manifests').then((module) => ({ default: module.Manifests })));
const Scanning = lazy(() => import('@/pages/Scanning').then((module) => ({ default: module.Scanning })));
const Inventory = lazy(() => import('@/pages/Inventory').then((module) => ({ default: module.Inventory })));
const Bookings = lazy(() => import('@/pages/Bookings').then((module) => ({ default: module.Bookings })));
const Exceptions = lazy(() => import('@/pages/Exceptions').then((module) => ({ default: module.Exceptions })));
const Customers = lazy(() => import('@/pages/Customers').then((module) => ({ default: module.Customers })));
const Management = lazy(() => import('@/pages/Management').then((module) => ({ default: module.Management })));
const Settings = lazy(() => import('@/pages/Settings').then((module) => ({ default: module.Settings })));
const PublicTracking = lazy(() => import('@/pages/PublicTracking').then((module) => ({ default: module.PublicTracking })));
const PrintLabel = lazy(() => import('@/pages/PrintLabel').then((module) => ({ default: module.PrintLabel })));
const Notifications = lazy(() => import('@/pages/Notifications').then((module) => ({ default: module.Notifications })));
const DevUIKit = lazy(() => import('@/pages/DevUIKit').then((module) => ({ default: module.DevUIKit })));
const ShiftReport = lazy(() => import('@/pages/ShiftReport'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Messages = lazy(() => import('@/pages/admin/Messages').then((module) => ({ default: module.Messages })));
const SearchResults = lazy(() => import('@/pages/SearchResults').then((module) => ({ default: module.SearchResults })));
const ArrivalAudit = lazy(() => import('@/pages/ArrivalAudit').then((module) => ({ default: module.ArrivalAudit })));

export interface AppRoute {
    path: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    element: React.LazyExoticComponent<React.ComponentType<any>>;
    protected?: boolean;
    layout?: boolean;
    allowedRoles?: UserRole[];
}

export const routes: AppRoute[] = [
    // Public Routes
    { path: '/', element: Landing, protected: false, layout: false },
    { path: '/track', element: PublicTracking, protected: false, layout: false },
    { path: '/track/:awb', element: PublicTracking, protected: false, layout: false },

    // Protected Routes with Layout
    { path: '/dashboard', element: Dashboard, protected: true, layout: true },
    { path: '/bookings', element: Bookings, protected: true, layout: true },
    { path: '/analytics', element: Analytics, protected: true, layout: true, allowedRoles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF'] },
    { path: '/search', element: SearchResults, protected: true, layout: true },
    { path: '/shipments', element: Shipments, protected: true, layout: true },
    { path: '/shipments/:id', element: ShipmentDetailsPage, protected: true, layout: true },
    { path: '/tracking', element: Tracking, protected: true, layout: true },
    { path: '/manifests', element: Manifests, protected: true, layout: true, allowedRoles: ['ADMIN', 'MANAGER', 'OPS_STAFF'] },
    { path: '/scanning', element: Scanning, protected: true, layout: true, allowedRoles: ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF'] },
    { path: '/arrival-audit', element: ArrivalAudit, protected: true, layout: true, allowedRoles: ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF'] },
    { path: '/inventory', element: Inventory, protected: true, layout: true, allowedRoles: ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF'] },
    { path: '/exceptions', element: Exceptions, protected: true, layout: true, allowedRoles: ['ADMIN', 'MANAGER', 'OPS_STAFF', 'WAREHOUSE_STAFF'] },
    { path: '/finance', element: Finance, protected: true, layout: true, allowedRoles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF'] },
    { path: '/customers', element: Customers, protected: true, layout: true, allowedRoles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF', 'OPS_STAFF'] },
    { path: '/management', element: Management, protected: true, layout: true, allowedRoles: ['ADMIN', 'MANAGER'] },
    { path: '/admin/messages', element: Messages, protected: true, layout: true, allowedRoles: ['ADMIN'] },
    { path: '/settings', element: Settings, protected: true, layout: true },
    { path: '/shift-report', element: ShiftReport, protected: true, layout: true },
    { path: '/notifications', element: Notifications, protected: true, layout: true },

    // Other Protected Routes
    { path: '/print/label/:awb', element: PrintLabel, protected: false, layout: false },
    { path: '/dev/ui-kit', element: DevUIKit, protected: true, layout: false, allowedRoles: ['ADMIN'] },

    // 404
    { path: '*', element: NotFound, protected: false, layout: false },
];
