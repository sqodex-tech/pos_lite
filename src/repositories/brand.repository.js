const prisma = require('../config/prisma');

class BrandRepository {
    async create(tenantId, data, storeId) {
        return await prisma.brand.create({
            data: {
                ...data,
                tenantId,
                storeId
            }
        });
    }

    async findById(tenantId, id, storeId = null) {
        return await prisma.brand.findFirst({
            where: {
                id,
                tenantId,
                deletedAt: null,
                ...(storeId ? { storeId } : {})
            }
        });
    }

    async findAll(tenantId, params = {}) {
        const { storeId, status, search, skip, take } = params;
        
        const where = {
            tenantId,
            deletedAt: null
        };

        if (storeId) where.storeId = storeId;
        if (status) where.status = status;
        if (search) {
            where.name = { contains: search };
        }

        const [total, brands] = await Promise.all([
            prisma.brand.count({ where }),
            prisma.brand.findMany({
                where,
                skip,
                take,
                orderBy: { name: 'asc' }
            })
        ]);

        return { total, brands };
    }

    async update(tenantId, id, data, storeId = null) {
        const existing = await this.findById(tenantId, id, storeId);
        if (!existing) return null;

        return await prisma.brand.update({
            where: { id },
            data
        });
    }

    async delete(tenantId, id, storeId = null) {
        const existing = await this.findById(tenantId, id, storeId);
        if (!existing) return null;

        return await prisma.brand.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'inactive' }
        });
    }
}

module.exports = new BrandRepository();
