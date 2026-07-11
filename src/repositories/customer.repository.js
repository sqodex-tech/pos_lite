const prisma = require('../config/prisma');

class CustomerRepository {
    async create(customerData, tx = null) {
        const client = tx || prisma;
        return await client.customer.create({
            data: customerData
        });
    }

    async findByTenant(tenantId, options = {}) {
        const { page = 1, search, storeId } = options;
        const limitNum = Math.min(parseInt(options.limit) || 20, 100);
        const pageNum = parseInt(page);
        
        const where = { tenantId, deletedAt: null };

        if (storeId) {
            where.storeId = storeId;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { phone: { contains: search } },
                { email: { contains: search } }
            ];
        }

        const customers = await prisma.customer.findMany({
            where,
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.customer.count({ where });
        return { customers, total, page: pageNum, limit: limitNum };
    }

    async findById(tenantId, customerId, storeId = null) {
        const where = { id: customerId, tenantId, deletedAt: null };
        if (storeId) where.storeId = storeId;
        return await prisma.customer.findFirst({ where });
    }

    async update(tenantId, customerId, updateData, storeId = null, tx = null) {
        const client = tx || prisma;
        const where = { id: customerId, tenantId };
        
        // Prisma doesn't support multiple conditions in `where` for updates unless they are part of a unique index.
        // Usually, ID is unique, but we should verify tenantId/storeId match if required.
        // Let's find first to ensure it belongs to the tenant/store, then update by ID.
        const existing = await client.customer.findFirst({
            where: { ...where, deletedAt: null, ...(storeId ? { storeId } : {}) }
        });
        
        if (!existing) return null;

        return await client.customer.update({
            where: { id: customerId },
            data: updateData
        });
    }

    async updateBalance(tenantId, customerId, amount, storeId = null, tx = null) {
        const client = tx || prisma;
        const where = { id: customerId, tenantId };
        
        const existing = await client.customer.findFirst({
            where: { ...where, deletedAt: null, ...(storeId ? { storeId } : {}) }
        });
        
        if (!existing) return null;

        return await client.customer.update({
            where: { id: customerId },
            data: { outstandingBalance: { increment: amount } }
        });
    }

    async delete(tenantId, customerId, storeId = null) {
        const where = { id: customerId, tenantId };
        
        const existing = await prisma.customer.findFirst({
            where: { ...where, deletedAt: null, ...(storeId ? { storeId } : {}) }
        });
        
        if (!existing) return null;

        return await prisma.customer.update({
            where: { id: customerId },
            data: { deletedAt: new Date(), status: 'INACTIVE' }
        });
    }
}

module.exports = new CustomerRepository();
