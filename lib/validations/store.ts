import { z } from 'zod';

export const storeSchema = z.object({
    name: z.string()
        .min(3, 'Store name must be at least 3 characters')
        .max(100, 'Store name must be less than 100 characters'),
    code: z.string()
        .min(3, 'Store code must be at least 3 characters')
        .max(20, 'Store code must be less than 20 characters'),
    address: z.string()
        .min(5, 'Address must be at least 5 characters')
        .optional()
        .or(z.literal('')),
    phone: z.string()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
        .optional()
        .or(z.literal('')),
    email: z.string()
        .email('Invalid email address')
        .optional()
        .or(z.literal('')),
    managerUserId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Manager User ID')
        .optional(),
    status: z.enum(['active', 'inactive']),
});

export type StoreFormValues = z.infer<typeof storeSchema>;
