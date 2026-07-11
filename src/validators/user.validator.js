const { z } = require('zod');

const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT']).optional(),
        phone: z.string().optional(),
        tenantId: z.string().min(1, 'Invalid ID').optional(), // Only for SUPER_ADMIN creating users
        defaultStoreId: z.string().min(1, 'Invalid ID').optional(),
        assignedStores: z.array(z.string().min(1, 'Invalid ID')).optional()
    })
}).passthrough();

const updateUserSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT']).optional(),
        status: z.enum(['active', 'inactive']).optional(),
        password: z.string().min(8).optional(),
        defaultStoreId: z.string().min(1, 'Invalid ID').optional(),
        assignedStores: z.array(z.string().min(1, 'Invalid ID')).optional()
    })
}).passthrough();

const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50).optional(),
        phone: z.string().optional(),
        password: z.string().min(8).optional(),
        currentPassword: z.string().optional()
    }).refine(data => {
        // If password is provided, currentPassword must also be provided
        if (data.password && !data.currentPassword) {
            return false;
        }
        return true;
    }, {
        message: 'Current password is required when changing password',
        path: ['currentPassword']
    })
}).passthrough();

module.exports = {
    createUserSchema,
    updateUserSchema,
    updateProfileSchema
};
