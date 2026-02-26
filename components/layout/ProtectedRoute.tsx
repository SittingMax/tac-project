import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

export const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
    children,
    allowedRoles,
}) => {
    const { isAuthenticated, user, isLoading } = useAuthStore();
    const location = useLocation();

    // Show loading while auth is initializing
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-none animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Verifying credentials...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        // Not authenticated, redirect to login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has required role
    const hasAccess = (() => {
        // No role restriction = everyone can access
        if (!allowedRoles || allowedRoles.length === 0) return true;

        // SUPER_ADMIN has god mode
        if (user.role === 'SUPER_ADMIN') return true;

        // ADMIN and MANAGER have access to everything
        if (user.role === 'ADMIN' || user.role === 'MANAGER') return true;

        // Direct role match
        if (allowedRoles.includes(user.role)) return true;

        // Handle legacy role name mappings
        if (allowedRoles.includes('FINANCE_STAFF') && user.role === 'INVOICE') return true;
        if (allowedRoles.includes('OPS_STAFF') && user.role === 'OPS') return true;
        if (
            allowedRoles.includes('WAREHOUSE_STAFF') &&
            (user.role === 'WAREHOUSE_IMPHAL' || user.role === 'WAREHOUSE_DELHI')
        )
            return true;

        return false;
    })();

    if (!hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-center p-4">
                <div>
                    <h1 className="text-4xl font-bold text-destructive mb-2">403 Forbidden</h1>
                    <p className="text-muted-foreground mb-4">
                        Your clearance level ({user?.role || 'GUEST'}) is insufficient for this sector.
                    </p>
                    <Link to="/dashboard" className="text-primary hover:underline">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
