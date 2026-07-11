import { z } from 'zod';

export const userSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
    role: z.enum(['STORE_MANAGER', 'SALES', 'ACCOUNTANT', 'TENANT_ADMIN']),
    status: z.enum(['active', 'inactive']),
    assignedStores: z.array(z.string()).optional(),
    defaultStoreId: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;
