const prisma = require('../config/prisma');
const supplierRepository = require('../repositories/supplier.repository');
const ApiError = require('../utils/ApiError');

class SupplierService {
    async createSupplier(tenantId, storeId, supplierData) {
        return await supplierRepository.create({ ...supplierData, tenantId, storeId });
    }

    async getSuppliers(tenantId, options) {
        return await supplierRepository.findByTenant(tenantId, options);
    }

    async getSupplierById(tenantId, supplierId, storeId) {
        const supplier = await supplierRepository.findById(tenantId, supplierId, storeId);
        if (!supplier) throw new ApiError(404, 'Supplier not found');
        return supplier;
    }

    async updateSupplier(tenantId, supplierId, updateData, storeId) {
        const supplier = await supplierRepository.update(tenantId, supplierId, updateData, storeId);
        if (!supplier) throw new ApiError(404, 'Supplier not found');
        return supplier;
    }

    async deleteSupplier(tenantId, supplierId, storeId) {
        const supplier = await supplierRepository.delete(tenantId, supplierId, storeId);
        if (!supplier) throw new ApiError(404, 'Supplier not found');
        return supplier;
    }

    async recordPayment(tenantId, storeId, userId, supplierId, paymentData) {
        return await prisma.$transaction(async (tx) => {
            const supplier = await supplierRepository.findById(tenantId, supplierId, storeId);
            if (!supplier) throw new ApiError(404, 'Supplier not found');

            const { amount, paymentMethod, description } = paymentData;

            // 1. Decrease Supplier payable balance
            // Paying reduces what we owe them
            await supplierRepository.updateBalance(tenantId, supplierId, -amount, storeId, tx);

            // 2. Add to Cash Ledger
            await tx.cashLedger.create({
                data: {
                    tenantId,
                    storeId,
                    userId,
                    type: 'OUT',
                    amount,
                    referenceType: 'SUPPLIER_PAYMENT',
                    referenceId: supplierId,
                    description: description || `Payment made to supplier ${supplier.name} via ${paymentMethod}`
                }
            });

            // Return updated supplier info
            return await supplierRepository.findById(tenantId, supplierId, storeId);
        });
    }
}

module.exports = new SupplierService();
