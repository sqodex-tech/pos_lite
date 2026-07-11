const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class StockService {
    /**
     * Get or create stock record for item in store
     */
    async getOrCreateStock(tenantId, storeId, itemId, tx = null) {
        const client = tx || prisma;
        let stock = await client.stock.findFirst({
            where: { storeId, itemId }
        });
        
        if (!stock) {
            stock = await client.stock.create({
                data: {
                    tenantId,
                    storeId,
                    itemId,
                    quantity: 0
                }
            });
        }
        
        return stock;
    }

    /**
     * Update stock quantity with movement tracking
     */
    async updateStock(tenantId, storeId, itemId, quantity, type, userId, transactionId = null, reason = '', notes = '', tx = null) {
        const client = tx || prisma;
        
        // Use a transaction if not provided
        if (!tx) {
            return await prisma.$transaction(async (prismaTx) => {
                return await this._updateStockInternal(tenantId, storeId, itemId, quantity, type, userId, transactionId, reason, notes, prismaTx);
            });
        }

        return await this._updateStockInternal(tenantId, storeId, itemId, quantity, type, userId, transactionId, reason, notes, client);
    }

    async _updateStockInternal(tenantId, storeId, itemId, quantity, type, userId, transactionId, reason, notes, tx) {
        const stock = await this.getOrCreateStock(tenantId, storeId, itemId, tx);
        
        const previousQuantity = stock.quantity;
        const newQuantity = previousQuantity + quantity;

        if (newQuantity < 0) {
            const item = await tx.item.findUnique({ where: { id: itemId } });
            throw new ApiError(400, `Insufficient stock for ${item?.name || 'item'}. Available: ${previousQuantity}, Required: ${Math.abs(quantity)}`);
        }

        // Update stock
        const updateData = { quantity: newQuantity };
        
        if (type === 'IN' || type === 'ADJUSTMENT') {
            updateData.lastRestocked = new Date();
        } else if (type === 'OUT') {
            updateData.lastSold = new Date();
        }
        
        const updatedStock = await tx.stock.update({
            where: { id: stock.id },
            data: updateData
        });

        // Record movement
        await tx.stockMovement.create({
            data: {
                tenantId,
                storeId,
                itemId,
                transactionId,
                type,
                quantity: Math.abs(quantity),
                previousQuantity,
                newQuantity,
                reason,
                notes,
                createdById: userId
            }
        });

        return updatedStock;
    }

    /**
     * Get stock level for item in store
     */
    async getStockLevel(storeId, itemId) {
        const stock = await prisma.stock.findFirst({
            where: { storeId, itemId }
        });
        return stock ? stock.quantity : 0;
    }

    /**
     * Get all stock for a store with low stock alerts
     */
    async getStoreStock(tenantId, storeId, options = {}) {
        const { page = 1, limit = 20, lowStockOnly = false, search } = options;
        
        const where = { tenantId, storeId };
        
        if (search) {
            where.item = {
                name: { contains: search }
            };
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;

        const stocks = await prisma.stock.findMany({
            where,
            include: {
                item: true
            },
            skip,
            take: limitNum
        });

        // Filter out null items and check low stock
        const stockData = stocks
            .filter(s => s.item)
            .map(stock => ({
                ...stock,
                isLowStock: stock.quantity <= (stock.item.lowStockAlert || 5)
            }));

        // Filter by low stock if requested
        const filteredData = lowStockOnly 
            ? stockData.filter(s => s.isLowStock)
            : stockData;

        const total = await prisma.stock.count({ where });

        return {
            stocks: filteredData,
            total,
            page: pageNum,
            limit: limitNum
        };
    }

    /**
     * Get stock movements for item in store
     */
    async getStockMovements(storeId, itemId, options = {}) {
        const { page = 1, limit = 50, startDate, endDate } = options;
        
        const where = { storeId, itemId };
        
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;

        const movements = await prisma.stockMovement.findMany({
            where,
            include: {
                createdBy: { select: { name: true, email: true } },
                transaction: { select: { type: true, total: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
        });

        const total = await prisma.stockMovement.count({ where });

        return {
            movements,
            total,
            page: pageNum,
            limit: limitNum
        };
    }

    /**
     * Adjust stock manually (for corrections, damage, etc.)
     */
    async adjustStock(tenantId, storeId, itemId, newQuantity, reason, userId, notes = '') {
        return await prisma.$transaction(async (tx) => {
            const stock = await this.getOrCreateStock(tenantId, storeId, itemId, tx);
            const difference = newQuantity - stock.quantity;
            
            return await this._updateStockInternal(
                tenantId,
                storeId,
                itemId,
                difference,
                'ADJUSTMENT',
                userId,
                null,
                reason,
                notes,
                tx
            );
        });
    }

    /**
     * Transfer stock between stores
     */
    async transferStock(tenantId, fromStoreId, toStoreId, itemId, quantity, userId, notes = '') {
        return await prisma.$transaction(async (tx) => {
            // Decrease from source store
            await this._updateStockInternal(
                tenantId,
                fromStoreId,
                itemId,
                -quantity,
                'OUT',
                userId,
                null,
                'Transfer to another store',
                notes,
                tx
            );

            // Increase in destination store
            await this._updateStockInternal(
                tenantId,
                toStoreId,
                itemId,
                quantity,
                'IN',
                userId,
                null,
                'Transfer from another store',
                notes,
                tx
            );

            return { success: true };
        });
    }
}

module.exports = new StockService();
