import { useState, useEffect, useCallback } from 'react';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    permissions?: string[];
    tenantId?: {
        _id: string;
        name: string;
        email: string;
        status: string;
        hasUsedTrial: boolean;
        subscriptionPlan?: {
            _id: string;
            name: string;
            price: number;
            durationInDays: number;
        };
    };
}

export function usePermissions() {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
                setPermissions(userData.permissions || []);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
        setLoading(false);
    }, []);

    const hasPermission = useCallback((permission: string): boolean => {
        if (!user) return false;

        // ADMIN has all permissions
        if (user.role === 'ADMIN') return true;

        return permissions.includes(permission);
    }, [user, permissions]);

    const hasAnyPermission = useCallback((perms: string[]): boolean => {
        if (!user) return false;

        // ADMIN has all permissions
        if (user.role === 'ADMIN') return true;

        return perms.some(perm => permissions.includes(perm));
    }, [user, permissions]);

    const hasAllPermissions = useCallback((perms: string[]): boolean => {
        if (!user) return false;

        // ADMIN has all permissions
        if (user.role === 'ADMIN') return true;

        return perms.every(perm => permissions.includes(perm));
    }, [user, permissions]);

    const hasRole = useCallback((roles: string | string[]): boolean => {
        if (!user) return false;

        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    }, [user]);

    return {
        user,
        permissions,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole
    };
}

// Permission constants (must match backend)
export const PERMISSIONS = {
    // Tenant Management
    MANAGE_TENANTS: 'manage_tenants',
    VIEW_TENANTS: 'view_tenants',

    // User Management
    MANAGE_USERS: 'manage_users',
    VIEW_USERS: 'view_users',

    // Store Management
    MANAGE_STORES: 'manage_stores',
    VIEW_STORES: 'view_stores',

    // Inventory Management
    MANAGE_INVENTORY: 'manage_inventory',
    VIEW_INVENTORY: 'view_inventory',
    ADJUST_INVENTORY: 'adjust_inventory',

    // Transaction/Sales
    CREATE_TRANSACTION: 'create_transaction',
    VIEW_TRANSACTIONS: 'view_transactions',
    VOID_TRANSACTION: 'void_transaction',
    REFUND_TRANSACTION: 'refund_transaction',

    // Expenses
    CREATE_EXPENSE: 'create_expense',
    VIEW_EXPENSES: 'view_expenses',
    APPROVE_EXPENSE: 'approve_expense',
    DELETE_EXPENSE: 'delete_expense',

    // Reports
    VIEW_REPORTS: 'view_reports',
    VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
    EXPORT_REPORTS: 'export_reports',

    // Settings
    MANAGE_SETTINGS: 'manage_settings',
    VIEW_SETTINGS: 'view_settings',

    // Customers & Suppliers
    MANAGE_CUSTOMERS: 'manage_customers',
    VIEW_CUSTOMERS: 'view_customers',
    MANAGE_SUPPLIERS: 'manage_suppliers',
    VIEW_SUPPLIERS: 'view_suppliers',

    // Plans & Subscriptions
    MANAGE_PLANS: 'manage_plans',
    MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
    VIEW_ANALYTICS: 'view_analytics'
};
