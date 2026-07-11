import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
    children: React.ReactNode;
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
    role?: string | string[];
    fallback?: React.ReactNode;
}

/**
 * Component to conditionally render content based on user permissions
 * 
 * @example
 * // Single permission
 * <PermissionGate permission="manage_users">
 *   <Button>Create User</Button>
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (any)
 * <PermissionGate permissions={['manage_users', 'view_users']}>
 *   <UserList />
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (all required)
 * <PermissionGate permissions={['manage_users', 'manage_stores']} requireAll>
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * @example
 * // Role-based
 * <PermissionGate role={['ADMIN', 'STORE_MANAGER']}>
 *   <ManagerDashboard />
 * </PermissionGate>
 */
export function PermissionGate({
    children,
    permission,
    permissions,
    requireAll = false,
    role,
    fallback = null
}: PermissionGateProps) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, loading } = usePermissions();

    if (loading) {
        return null;
    }

    // Check role first if provided
    if (role && !hasRole(role)) {
        return <>{fallback}</>;
    }

    // Check single permission
    if (permission && !hasPermission(permission)) {
        return <>{fallback}</>;
    }

    // Check multiple permissions
    if (permissions) {
        const hasAccess = requireAll 
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);
        
        if (!hasAccess) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}

/**
 * Hook version for conditional logic
 */
export function usePermissionCheck(
    permission?: string,
    permissions?: string[],
    requireAll = false
) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

    if (loading) {
        return false;
    }

    if (permission) {
        return hasPermission(permission);
    }

    if (permissions) {
        return requireAll 
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);
    }

    return false;
}
