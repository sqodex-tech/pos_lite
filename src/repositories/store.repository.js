const prisma = require('../config/prisma');

class StoreRepository {
    async create(storeData) {
        return await prisma.store.create({ data: storeData });
    }

    async findByTenant(tenantId, options = {}) {
        const { page = 1, search } = options;
        const limit = Math.min(parseInt(options.limit) || 20, 100);
        
        const where = { tenantId, deletedAt: null };

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { code: { contains: search } }
            ];
        }

        const stores = await prisma.store.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.store.count({ where });
        return { stores, total, page, limit };
    }

    async findById(tenantId, storeId) {
        return await prisma.store.findFirst({
            where: { id: storeId, tenantId, deletedAt: null }
        });
    }

    async update(tenantId, storeId, updateData) {
        // Find first to ensure it belongs to the tenant
        const store = await prisma.store.findFirst({
            where: { id: storeId, tenantId, deletedAt: null }
        });
        
        if (!store) return null;

        return await prisma.store.update({
            where: { id: storeId },
            data: updateData
        });
    }

    async delete(tenantId, storeId) {
        const store = await prisma.store.findFirst({
            where: { id: storeId, tenantId, deletedAt: null }
        });
        
        if (!store) return null;

        return await prisma.store.update({
            where: { id: storeId },
            data: { deletedAt: new Date(), status: 'inactive' }
        });
    }

    async countByTenant(tenantId) {
        return await prisma.store.count({ where: { tenantId, deletedAt: null } });
    }
}

module.exports = new StoreRepository();
