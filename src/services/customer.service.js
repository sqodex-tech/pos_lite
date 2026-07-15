const prisma = require('../config/prisma');
const customerRepository = require('../repositories/customer.repository');
const transactionService = require('./transaction.service');
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

            // 1.5 Update the dynamic PartyBalance ledger to keep dashboard perfectly synced
            const existingParty = await tx.partyBalance.findFirst({
                where: { tenantId, storeId, partyId: customerId, partyType: 'CUSTOMER' }
            });
            if (existingParty) {
                await tx.partyBalance.update({
                    where: { id: existingParty.id },
                    data: { currentBalance: { increment: -amount } }
                });
            } else {
                await tx.partyBalance.create({
                    data: { tenantId, storeId, partyId: customerId, partyType: 'CUSTOMER', currentBalance: -amount }
                });
            }

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

            // 3. Create a Transaction row so it appears in the Customer Statement
            const txnNumber = await transactionService.generateTransactionNumber(tenantId, 'PAY');
            
            await tx.transaction.create({
                data: {
                    tenantId,
                    storeId,
                    userId,
                    partyType: 'CUSTOMER',
                    partyId: customerId,
                    transactionNumber: txnNumber,
                    type: 'PAYMENT_RECEIVED',
                    subtotal: amount,
                    total: amount,
                    paymentMethod: paymentMethod || 'CASH',
                    paymentDetails: { cash: amount },
                    balanceTracking: {
                        previousBalance: customer.outstandingBalance,
                        transactionImpact: -amount,
                        currentBalance: customer.outstandingBalance - amount
                    },
                    status: 'COMPLETED',
                    notes: description
                }
            });

            // Return updated customer info
            return await customerRepository.findById(tenantId, customerId, storeId);
        }, { maxWait: 10000, timeout: 20000 });
    }
}

module.exports = new CustomerService();
