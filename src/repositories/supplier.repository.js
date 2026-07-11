const prisma = require('../config/prisma');

class SupplierRepository {
    async create(supplierData, tx = null) {
        const client = tx || prisma;
        return await client.supplier.create({
            data: supplierData
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
                { companyName: { contains: search } },
                { phone: { contains: search } }
            ];
        }

        const suppliers = await prisma.supplier.findMany({
            where,
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.supplier.count({ where });
        return { suppliers, total, page: pageNum, limit: limitNum };
    }

    async findById(tenantId, supplierId, storeId = null) {
        const where = { id: supplierId, tenantId, deletedAt: null };
        if (storeId) where.storeId = storeId;
        return await prisma.supplier.findFirst({ where });
    }

    async update(tenantId, supplierId, updateData, storeId = null, tx = null) {
        const client = tx || prisma;
        const where = { id: supplierId, tenantId };
        
        const existing = await client.supplier.findFirst({
            where: { ...where, deletedAt: null, ...(storeId ? { storeId } : {}) }
        });
        
        if (!existing) return null;

        return await client.supplier.update({
            where: { id: supplierId },
            data: updateData
        });
    }

    async updateBalance(tenantId, supplierId, amount, storeId = null, tx = null) {
        const client = tx || prisma;
        const where = { id: supplierId, tenantId };
        
        const existing = await client.supplier.findFirst({
            where: { ...where, deletedAt: null, ...(storeId ? { storeId } : {}) }
        });
        
        if (!existing) return null;

        return await client.supplier.update({
            where: { id: supplierId },
            data: { payableBalance: { increment: amount } }
        });
    }

    async delete(tenantId, supplierId, storeId = null) {
        const where = { id: supplierId, tenantId };
        
        const existing = await prisma.supplier.findFirst({
            where: { ...where, deletedAt: null, ...(storeId ? { storeId } : {}) }
        });
        
        if (!existing) return null;

        return await prisma.supplier.update({
            where: { id: supplierId },
            data: { deletedAt: new Date(), status: 'INACTIVE' }
        });
    }
}

module.exports = new SupplierRepository();
