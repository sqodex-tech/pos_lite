const prisma = require('../config/prisma');
const customerRepository = require('../repositories/customer.repository');
const ApiError = require('../utils/ApiError');

class CustomerService {
    async createCustomer(tenantId, storeId, customerData) {
        return await customerRepository.create({ ...customerData, tenantId, storeId });
    }

    async getCustomers(tenantId, options) {
        return await customerRepository.findByTenant(tenantId, options);
    }

    async getCustomerById(tenantId, customerId, storeId = null) {
        const customer = await customerRepository.findById(tenantId, customerId, storeId);
        if (!customer) throw new ApiError(404, 'Customer not found');
        return customer;
    }

    async updateCustomer(tenantId, customerId, updateData, storeId = null) {
        const customer = await customerRepository.update(tenantId, customerId, updateData, storeId);
        if (!customer) throw new ApiError(404, 'Customer not found');
        return customer;
    }

    async deleteCustomer(tenantId, customerId, storeId = null) {
        const customer = await customerRepository.delete(tenantId, customerId, storeId);
        if (!customer) throw new ApiError(404, 'Customer not found');
        return customer;
    }

    async recordPayment(tenantId, storeId, userId, customerId, paymentData) {
        return await prisma.$transaction(async (tx) => {
            const customer = await customerRepository.findById(tenantId, customerId);
            if (!customer) throw new ApiError(404, 'Customer not found');

            const { amount, paymentMethod, description } = paymentData;

            // 1. Decrease Customer outstanding balance
            // Paying reduces what they owe us
            await customerRepository.updateBalance(tenantId, customerId, -amount, storeId, tx);

            // 2. Add to Cash Ledger
            await tx.cashLedger.create({
                data: {
                    tenantId,
                    storeId,
                    userId,
                    type: 'IN',
                    amount,
                    referenceType: 'CUSTOMER_PAYMENT',
                    referenceId: customerId,
                    description: description || `Payment received from customer ${customer.name} via ${paymentMethod}`
                }
            });

            // Return updated customer info
            return await customerRepository.findById(tenantId, customerId, storeId);
        });
    }
}

module.exports = new CustomerService();
