const prisma = require('../config/prisma');

class ExpenseRepository {
    async create(expenseData, tx) {
        const client = tx || prisma;
        return await client.expense.create({
            data: expenseData
        });
    }

    async findByTenant(tenantId, options = {}) {
        const { page = 1, storeId, categoryId, startDate, endDate } = options;
        const limitNum = Math.min(parseInt(options.limit) || 20, 100);
        const pageNum = parseInt(page);

        const where = { tenantId, deletedAt: null };
        if (storeId) where.storeId = storeId;
        if (categoryId) where.categoryId = categoryId;
        
        if (startDate || endDate) {
            where.expenseDate = {};
            if (startDate) where.expenseDate.gte = new Date(startDate);
            if (endDate) where.expenseDate.lte = new Date(endDate);
        }

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                category: { select: { name: true } },
                store: { select: { name: true } }
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            orderBy: { expenseDate: 'desc' }
        });

        const total = await prisma.expense.count({ where });
        return { expenses, total, page: pageNum, limit: limitNum };
    }

    async findById(tenantId, expenseId) {
        return await prisma.expense.findFirst({
            where: { id: expenseId, tenantId, deletedAt: null },
            include: {
                category: { select: { name: true } },
                store: { select: { name: true } }
            }
        });
    }

    async update(tenantId, expenseId, updateData, tx) {
        const client = tx || prisma;
        return await client.expense.update({
            where: { id: expenseId, tenantId },
            data: updateData
        });
    }

    async delete(tenantId, expenseId) {
        return await prisma.expense.update({
            where: { id: expenseId, tenantId },
            data: { deletedAt: new Date() }
        });
    }
}

module.exports = new ExpenseRepository();
