# Role-Based Access Control (RBAC) Implementation Guide

## Overview
SumboxPro implements a comprehensive, robust **Store-Scoped RBAC System**. This allows tenants to create multiple stores, wherein roles (`STORE_MANAGER`, `SALES`, `ACCOUNTANT`, etc.) have specific module-action permissions isolated to each store.

## Architecture

1. **RolePermission Model**: Granular, store-isolated configurations mapping Roles -> Modules -> Actions. 
2. **PermissionAuditLog**: A comprehensive trail of all changes made to the permissions.
3. **rbac.service.js**: The core logic handling lookups, caching (`node-cache`), overrides, and defaults.
4. **rbac.middleware.js**: Express routing middleware (`requireModuleAccess(module, action)`) configured at the route level.

## Store Lifecycle & Defaults
When an Admin creates a store (`POST /api/v1/stores`), `rbacService.seedStoreDefaults()` is triggered in the controller. This reads `DEFAULT_ROLE_MODULE_PERMISSIONS` from `src/utils/rolePermissions.js` and creates entries in the DB.

## Middleware Usage

Protecting routes is very simple using `requireModuleAccess`:

```javascript
const { requireModuleAccess } = require('../middleware/rbac.middleware');

// Requires inventory create permission in the active store
router.post(
    '/', 
    requireModuleAccess('inventory', 'create'), 
    createItem
);
```

### Context Isolation
The `requireModuleAccess` intercepts the request and determines the active store via:
1. `req.query.storeId`
2. `req.body.storeId`
3. `req.params.storeId`
4. Header `x-store-id`
5. `req.user.defaultStoreId`

Once confirmed, it fetches the cache/DB matching `Tenant -> Store -> Role -> Module -> Action`. 

## Admin Management (Permission Controller)

A detailed controller (`permission.controller.js`) provides dynamic updating:

- `GET /matrix?storeId=X` -> Get full permission matrix 
- `PATCH /roles/:role/modules/:module?storeId=X` -> Batch set actions
- `POST /roles/:role/modules/:module/grant?storeId=X` -> Add a specific action
- `POST /roles/:role/modules/:module/revoke?storeId=X` -> Remove a specific action
- `POST /roles/:role/reset?storeId=X` -> Reset to platform defaults
- `GET /audit-log?storeId=X` -> View changes
 
