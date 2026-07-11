export const ROLES = {
    ADMIN: 'ADMIN',
    STORE_MANAGER: 'STORE_MANAGER',
    SALES: 'SALES',
    ACCOUNTANT: 'ACCOUNTANT'
};

export const MODULES = {
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

export const MODULE_ACTIONS: Record<string, string[]> = {
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

export const MODULE_LABELS: Record<string, string> = {
    [MODULES.STORES]: 'Stores & Nodes',
    [MODULES.INVENTORY]: 'Inventory Matrix',
    [MODULES.CATEGORY]: 'Product Categories',
    [MODULES.UNITS]: 'Measurement Units',
    [MODULES.CUSTOMERS]: 'Customer Directory',
    [MODULES.SUPPLIERS]: 'Supplier Network',
    [MODULES.EXPENSES]: 'Financial Expenses',
    [MODULES.REPORTS]: 'Analytics & Reports',
    [MODULES.STAFF]: 'Staff Management',
    [MODULES.TRANSACTIONS]: 'Sales Transactions'
};
