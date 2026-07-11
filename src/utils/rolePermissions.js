/**
 * Store-Scoped Role-based permissions configuration
 */

const ROLES = {
    ADMIN: 'ADMIN',
    TENANT_ADMIN: 'TENANT_ADMIN',
    STORE_MANAGER: 'STORE_MANAGER',
    SALES: 'SALES',
    ACCOUNTANT: 'ACCOUNTANT'
};

const MODULES = {
    STORES: 'stores',
    INVENTORY: 'inventory',
    CATEGORY: 'category',
    UNITS: 'units',
    CUSTOMERS: 'customers',
    SUPPLIERS: 'suppliers',
    EXPENSES: 'expenses',
    REPORTS: 'reports',
    STAFF: 'staff',
    TRANSACTIONS: 'transactions'
};

const MODULE_ACTIONS = {
    [MODULES.STORES]: ['view', 'create', 'update', 'delete'],
    [MODULES.INVENTORY]: ['view', 'create', 'update', 'delete', 'adjust'],
    [MODULES.CATEGORY]: ['view', 'create', 'update', 'delete'],
    [MODULES.UNITS]: ['view', 'create', 'update', 'delete'],
    [MODULES.CUSTOMERS]: ['view', 'create', 'update', 'delete'],
    [MODULES.SUPPLIERS]: ['view', 'create', 'update', 'delete'],
    [MODULES.EXPENSES]: ['view', 'create', 'update', 'delete', 'approve'],
    [MODULES.REPORTS]: ['view', 'export'],
    [MODULES.STAFF]: ['view', 'create', 'update', 'delete'],
    [MODULES.TRANSACTIONS]: ['view', 'create', 'void', 'refund']
};

/**
 * System default permissions seeded when a new store is created.
 * All 4 tenant-level roles start with FULL access — tenants can customise
 * ANY of these roles (ADMIN, STORE_MANAGER, SALES, ACCOUNTANT).
 */
const DEFAULT_ROLE_MODULE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.keys(MODULE_ACTIONS).reduce((acc, mod) => ({ ...acc, [mod]: [...MODULE_ACTIONS[mod]] }), {}),
    [ROLES.TENANT_ADMIN]: Object.keys(MODULE_ACTIONS).reduce((acc, mod) => ({ ...acc, [mod]: [...MODULE_ACTIONS[mod]] }), {}),
    [ROLES.STORE_MANAGER]: Object.keys(MODULE_ACTIONS).reduce((acc, mod) => ({ ...acc, [mod]: [...MODULE_ACTIONS[mod]] }), {}),
    [ROLES.SALES]: Object.keys(MODULE_ACTIONS).reduce((acc, mod) => ({ ...acc, [mod]: [...MODULE_ACTIONS[mod]] }), {}),
    [ROLES.ACCOUNTANT]: Object.keys(MODULE_ACTIONS).reduce((acc, mod) => ({ ...acc, [mod]: [...MODULE_ACTIONS[mod]] }), {})
};

// Roles that a tenant is allowed to customise
const CUSTOMISABLE_ROLES = [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.SALES, ROLES.ACCOUNTANT];

// Legacy flat permissions for backward compatibility while migrating
const PERMISSIONS = {
    MANAGE_TENANTS: 'manage_tenants',
    VIEW_TENANTS: 'view_tenants',
    MANAGE_USERS: 'manage_users',
    VIEW_USERS: 'view_users',
    MANAGE_STORES: 'manage_stores',
    VIEW_STORES: 'view_stores',
    MANAGE_INVENTORY: 'manage_inventory',
    VIEW_INVENTORY: 'view_inventory',
    ADJUST_INVENTORY: 'adjust_inventory',
    CREATE_TRANSACTION: 'create_transaction',
    VIEW_TRANSACTIONS: 'view_transactions',
    VOID_TRANSACTION: 'void_transaction',
    REFUND_TRANSACTION: 'refund_transaction',
    CREATE_EXPENSE: 'create_expense',
    VIEW_EXPENSES: 'view_expenses',
    APPROVE_EXPENSE: 'approve_expense',
    DELETE_EXPENSE: 'delete_expense',
    VIEW_REPORTS: 'view_reports',
    VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
    EXPORT_REPORTS: 'export_reports',
    MANAGE_SETTINGS: 'manage_settings',
    VIEW_SETTINGS: 'view_settings',
    MANAGE_CUSTOMERS: 'manage_customers',
    VIEW_CUSTOMERS: 'view_customers',
    MANAGE_SUPPLIERS: 'manage_suppliers',
    VIEW_SUPPLIERS: 'view_suppliers',
    MANAGE_PLANS: 'manage_plans',
    MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
    VIEW_ANALYTICS: 'view_analytics'
};

const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.TENANT_ADMIN]: Object.values(PERMISSIONS),
    [ROLES.STORE_MANAGER]: Object.values(PERMISSIONS),
    [ROLES.SALES]: Object.values(PERMISSIONS),
    [ROLES.ACCOUNTANT]: Object.values(PERMISSIONS)
};

const getRolePermissions = (role) => ROLE_PERMISSIONS[role] || [];
const hasPermission = (role) => true; // compatibility
const hasAnyPermission = (role) => true; // compatibility
const hasAllPermissions = (role) => true; // compatibility
const requirePermission = (...permissions) => {
    return (req, res, next) => next();
} // will be replaced entirely by new rbac.middleware

module.exports = {
    ROLES,
    MODULES,
    MODULE_ACTIONS,
    DEFAULT_ROLE_MODULE_PERMISSIONS,
    CUSTOMISABLE_ROLES,

    // Legacy exports
    PERMISSIONS,
    ROLE_PERMISSIONS,
    getRolePermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    requirePermission
};
