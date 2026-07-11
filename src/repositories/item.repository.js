const prisma = require('../config/prisma');

class ItemRepository {
    async create(itemData) {
        return await prisma.item.create({
            data: itemData
        });
    }

    async findByTenant(tenantId, options = {}) {
        const { page = 1, search = '', storeId } = options;
        const limitNum = Math.min(parseInt(options.limit) || 20, 100);
        const pageNum = parseInt(page);
        
        const where = { tenantId, deletedAt: null };

        if (storeId) {
            where.storeId = storeId;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { barcode: { contains: search } }
            ];
        }

        const items = await prisma.item.findMany({
            where,
            select: {
                id: true,
                name: true,
                barcode: true,
                purchasePrice: true,
                salePrice: true,
                lowStockAlert: true,
                categoryId: true,
                unitId: true,
                status: true,
                category: { select: { name: true } },
                unit: { select: { name: true } }
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.item.count({ where });
        return { items, total, page: pageNum, limit: limitNum };
    }

    async findById(tenantId, itemId, storeId = null) {
        const where = { id: itemId, tenantId, deletedAt: null };
        if (storeId) where.storeId = storeId;
        
        return await prisma.item.findFirst({
            where,
            include: {
                category: { select: { name: true } },
                unit: { select: { name: true } }
            }
        });
    }

    async update(tenantId, itemId, updateData, storeId = null) {
        const where = { id: itemId, tenantId, deletedAt: null };
        
        const existing = await prisma.item.findFirst({
            where: { ...where, ...(storeId ? { storeId } : {}) }
        });
        
        if (!existing) return null;

        return await prisma.item.update({
            where: { id: itemId },
            data: updateData
        });
    }

    async delete(tenantId, itemId, storeId = null) {
        const where = { id: itemId, tenantId, deletedAt: null };
        
        const existing = await prisma.item.findFirst({
            where: { ...where, ...(storeId ? { storeId } : {}) }
        });
        
        if (!existing) return null;

        return await prisma.item.update({
            where: { id: itemId },
            data: { deletedAt: new Date(), status: 'inactive' }
        });
    }
}

module.exports = new ItemRepository();
