const prisma = require('../config/prisma');

class TransactionRepository {
    async create(transactionData, tx = null) {
        const client = tx || prisma;
        return await client.transaction.create({
            data: transactionData
        });
    }

    async findByTenant(tenantId, storeId, options = {}) {
        const { page = 1, type } = options;
        const limitNum = Math.min(parseInt(options.limit) || 20, 100);
        const pageNum = parseInt(page);
        
        const where = { tenantId, deletedAt: null };
        if (storeId) where.storeId = storeId;
        if (type) where.type = type;
        if (options.startDate && options.endDate) {
            where.date = {
                gte: new Date(options.startDate),
                lte: new Date(options.endDate)
            };
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                user: { select: { name: true } },
                items: {
                    include: {
                        item: { select: { name: true } }
                    }
                }
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.transaction.count({ where });
        return { transactions, total, page: pageNum, limit: limitNum };
    }

    async findById(tenantId, transactionId, storeId = null) {
        const where = { id: transactionId, tenantId, deletedAt: null };
        if (storeId) where.storeId = storeId;
        
        return await prisma.transaction.findFirst({
            where,
            include: {
                user: { select: { name: true } },
                items: {
                    include: {
                        item: { select: { name: true } }
                    }
                }
            }
        });
    }

    async update(tenantId, transactionId, updateData, storeId = null, tx = null) {
        const client = tx || prisma;
        const where = { id: transactionId, tenantId, deletedAt: null };
        
        const existing = await client.transaction.findFirst({
            where: { ...where, ...(storeId ? { storeId } : {}) }
        });
        
        if (!existing) return null;

        return await client.transaction.update({
            where: { id: transactionId },
            data: updateData
        });
    }

    async delete(tenantId, transactionId, storeId = null) {
        const where = { id: transactionId, tenantId, deletedAt: null };
        
        const existing = await prisma.transaction.findFirst({
            where: { ...where, ...(storeId ? { storeId } : {}) }
        });
        
        if (!existing) return null;

        return await prisma.transaction.update({
            where: { id: transactionId },
            data: { deletedAt: new Date(), status: 'CANCELLED' }
        });
    }
}

module.exports = new TransactionRepository();
