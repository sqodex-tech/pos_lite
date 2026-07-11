const prisma = require('../config/prisma');
const transactionRepository = require('../repositories/transaction.repository');
const inventoryService = require('./inventory.service');
const ApiError = require('../utils/ApiError');

class TransactionService {
    /**
     * Main entry point for creating transactions
     */
    async createTransaction(data, tenantId, userId) {
        // Map legacy fields to partyId if present
        if (!data.partyId) {
            data.partyId = data.customerId || data.supplierId;
        }
        if (!data.partyType) {
            data.partyType = data.type === 'SALE' ? 'CUSTOMER' : (data.type === 'PURCHASE' ? 'SUPPLIER' : undefined);
        }

        const { type } = data;
        
        switch (type) {
            case 'SALE':
                return await this.createSale(data, tenantId, userId);
            case 'PURCHASE':
                return await this.createPurchase(data, tenantId, userId);
            case 'PAYMENT_RECEIVED':
            case 'PAYMENT_MADE':
                return await this.recordPayment(data, tenantId, userId);
            default:
                // Fallback for types not yet specifically handled
                return await this.createGenericTransaction(data, tenantId, userId);
        }
    }

    async createSale(data, tenantId, userId) {
        return await prisma.$transaction(async (tx) => {
            const { storeId, partyId, items, total, paymentMethod } = data;
            
            // 1. Get current balance
            const currentBalance = await this.getPartyBalance(tenantId, storeId, partyId, 'CUSTOMER', tx);
            
            // 2. Calculate impact (Credit sale increases what customer owes us)
            let transactionImpact = (paymentMethod === 'CREDIT' || paymentMethod === 'MIXED') 
                ? (data.paymentDetails?.credit || total) 
                : 0;
            
            const newBalance = currentBalance + transactionImpact;
            
            // 3. Validate Inventory & Generate Number
            const transactionNumber = await this.generateTransactionNumber(tenantId, 'SALE');
            
            const createData = { ...data };
            delete createData.items;

            // 4. Create Transaction
            const transaction = await transactionRepository.create({
                ...createData,
                transactionNumber,
                tenantId,
                userId,
                partyType: 'CUSTOMER',
                balanceTracking: {
                    previousBalance: currentBalance,
                    transactionImpact: transactionImpact,
                    currentBalance: newBalance,
                    formattedPrevious: this.formatBalanceWithSign(currentBalance, 'CUSTOMER'),
                    formattedImpact: this.formatBalanceWithSign(transactionImpact, 'CUSTOMER'),
                    formattedCurrent: this.formatBalanceWithSign(newBalance, 'CUSTOMER')
                },
                items: {
                    create: items ? items.map(item => ({
                        itemId: item.itemId,
                        itemName: item.itemName || '',
                        quantity: item.quantity,
                        price: item.price,
                        discount: item.discount || 0,
                        total: item.total || (item.quantity * item.price)
                    })) : []
                }
            }, tx);
            
            // 5. Update Inventory (SUB)
            for (const item of items) {
                await inventoryService.updateStock(tenantId, storeId, item.itemId, item.quantity, 'SUB', { tx });
            }
            
            // 6. Update Party Balance
            await this.updatePartyBalance({
                tenantId, storeId, partyId, partyType: 'CUSTOMER',
                impact: transactionImpact, type: 'PURCHASE', total
            }, tx);
            
            // 7. Cash Ledger entry if paid
            if (['CASH', 'CARD', 'BANK_TRANSFER', 'MIXED'].includes(paymentMethod)) {
                const paidAmount = paymentMethod === 'MIXED' 
                    ? (total - (data.paymentDetails?.credit || 0)) 
                    : total;
                
                if (paidAmount > 0) {
                    await this.createCashLedgerEntry({
                        tenantId, storeId, userId, amount: paidAmount,
                        type: 'IN', referenceId: transaction.id,
                        description: `Sale ${transactionNumber}`
                    }, tx);
                }
            }
            
            return transaction;
        });
    }

    async createPurchase(data, tenantId, userId) {
        return await prisma.$transaction(async (tx) => {
            const { storeId, partyId, items, total, paymentMethod } = data;
            
            const currentBalance = await this.getPartyBalance(tenantId, storeId, partyId, 'SUPPLIER', tx);
            
            // Impact is negative (we owe supplier more)
            let transactionImpact = (paymentMethod === 'CREDIT' || paymentMethod === 'MIXED') 
                ? -(data.paymentDetails?.credit || total) 
                : 0;
            
            const newBalance = currentBalance + transactionImpact;
            const transactionNumber = await this.generateTransactionNumber(tenantId, 'PURCHASE');
            
            const createData = { ...data };
            delete createData.items;

            const transaction = await transactionRepository.create({
                ...createData,
                transactionNumber,
                tenantId,
                userId,
                partyType: 'SUPPLIER',
                balanceTracking: {
                    previousBalance: currentBalance,
                    transactionImpact,
                    currentBalance: newBalance,
                    formattedPrevious: this.formatBalanceWithSign(currentBalance, 'SUPPLIER'),
                    formattedImpact: this.formatBalanceWithSign(transactionImpact, 'SUPPLIER'),
                    formattedCurrent: this.formatBalanceWithSign(newBalance, 'SUPPLIER')
                },
                items: {
                    create: items ? items.map(item => ({
                        itemId: item.itemId,
                        itemName: item.itemName || '',
                        quantity: item.quantity,
                        price: item.price,
                        discount: item.discount || 0,
                        total: item.total || (item.quantity * item.price)
                    })) : []
                }
            }, tx);
            
            for (const item of items) {
                await inventoryService.updateStock(tenantId, storeId, item.itemId, item.quantity, 'ADD', { tx });
            }
            
            await this.updatePartyBalance({
                tenantId, storeId, partyId, partyType: 'SUPPLIER',
                impact: transactionImpact, type: 'PURCHASE', total
            }, tx);
            
            return transaction;
        });
    }

    async recordPayment(data, tenantId, userId) {
        return await prisma.$transaction(async (tx) => {
            const { storeId, partyId, partyType, total, type } = data;
            
            const currentBalance = await this.getPartyBalance(tenantId, storeId, partyId, partyType, tx);
            
            // If CUSTOMER pays us: Impact is negative (decreases what they owe us)
            // If we pay SUPPLIER: Impact is positive (decreases what we owe them)
            let transactionImpact = partyType === 'CUSTOMER' ? -total : total;
            const newBalance = currentBalance + transactionImpact;
            
            const transactionNumber = await this.generateTransactionNumber(tenantId, 'PAYMENT');
            
            const transaction = await transactionRepository.create({
                ...data,
                transactionNumber,
                tenantId,
                userId,
                balanceTracking: {
                    previousBalance: currentBalance,
                    transactionImpact,
                    currentBalance: newBalance,
                    formattedPrevious: this.formatBalanceWithSign(currentBalance, partyType),
                    formattedImpact: this.formatBalanceWithSign(transactionImpact, partyType),
                    formattedCurrent: this.formatBalanceWithSign(newBalance, partyType)
                }
            }, tx);
            
            await this.updatePartyBalance({
                tenantId, storeId, partyId, partyType,
                impact: transactionImpact, type: 'PAYMENT', total
            }, tx);
            
            await this.createCashLedgerEntry({
                tenantId, storeId, userId, amount: total,
                type: partyType === 'CUSTOMER' ? 'IN' : 'OUT',
                referenceId: transaction.id,
                description: `Payment ${transactionNumber} (${partyType})`
            }, tx);
            
            return transaction;
        });
    }

    // Helper Methods
    async getPartyBalance(tenantId, storeId, partyId, partyType, tx = null) {
        const client = tx || prisma;
        let balanceDoc = await client.partyBalance.findFirst({ 
            where: { tenantId, storeId, partyId, partyType } 
        });
        
        if (!balanceDoc) {
            balanceDoc = await client.partyBalance.create({ 
                data: { tenantId, storeId, partyId, partyType } 
            });
            return 0;
        }
        return balanceDoc.currentBalance || 0;
    }

    async updatePartyBalance({ tenantId, storeId, partyId, partyType, impact, type, total }, tx = null) {
        const client = tx || prisma;

        // Upsert because it might not exist yet if created parallelly or manually
        let existing = await client.partyBalance.findFirst({
            where: { tenantId, storeId, partyId, partyType }
        });

        if (!existing) {
            existing = await client.partyBalance.create({
                data: { tenantId, storeId, partyId, partyType }
            });
        }

        const breakdown = existing.balanceBreakdown || {};
        if (type === 'PURCHASE') {
            breakdown.totalPurchases = (breakdown.totalPurchases || 0) + total;
        } else if (type === 'PAYMENT') {
            breakdown.totalPayments = (breakdown.totalPayments || 0) + total;
        }

        const updateData = {
            currentBalance: { increment: impact },
            transactionCount: { increment: 1 },
            balanceBreakdown: breakdown,
            lastTransactionDate: new Date()
        };
        
        if (type === 'PAYMENT') {
            updateData.lastPaymentDate = new Date();
        }

        await client.partyBalance.update({
            where: { id: existing.id },
            data: updateData
        });
    }

    async generateTransactionNumber(tenantId, prefix) {
        const count = await prisma.transaction.count({ 
            where: { tenantId, type: { startsWith: prefix } } 
        });
        return `${prefix}-${Date.now()}-${count + 1}`;
    }

    formatBalanceWithSign(balance, partyType) {
        const absValue = Math.abs(balance).toFixed(2);
        if (partyType === 'CUSTOMER') {
            return balance >= 0 ? `+$${absValue} (Owes)` : `-$${absValue} (Credit)`;
        } else {
            return balance <= 0 ? `-$${absValue} (Payable)` : `+$${absValue} (Prepaid)`;
        }
    }

    async createCashLedgerEntry({ tenantId, storeId, userId, amount, type, referenceId, description }, tx = null) {
        const client = tx || prisma;
        await client.cashLedger.create({
            data: {
                tenantId, storeId, userId, amount, type,
                referenceType: 'TRANSACTION', referenceId, description
            }
        });
    }

    async createGenericTransaction(data, tenantId, userId) {
        const createData = { ...data };
        const items = createData.items;
        delete createData.items;

        if (!createData.transactionNumber) {
            createData.transactionNumber = await this.generateTransactionNumber(tenantId, 'GENERIC');
        }

        return await transactionRepository.create({ 
            ...createData, 
            tenantId, 
            userId,
            items: items ? {
                create: items.map(item => ({
                    itemId: item.itemId,
                    itemName: item.itemName || '',
                    quantity: item.quantity,
                    price: item.price,
                    discount: item.discount || 0,
                    total: item.total || (item.quantity * item.price)
                }))
            } : undefined
        });
    }

    /**
     * Get party statement with running balance
     */
    async getPartyStatement(tenantId, storeId, partyId, partyType, startDate, endDate) {
        const query = {
            tenantId,
            storeId,
            partyId,
            partyType,
            date: { gte: new Date(startDate), lte: new Date(endDate) },
            status: { not: 'VOID' }
        };

        const transactions = await prisma.transaction.findMany({
            where: query,
            orderBy: { date: 'asc' }
        });
        
        // Calculate opening balance
        let runningBalance = transactions.length > 0 ? (transactions[0].balanceTracking?.previousBalance || 0) : 0;
        
        const statement = transactions.map(transaction => {
            const impact = transaction.balanceTracking?.transactionImpact || 0;
            const prev = runningBalance;
            runningBalance += impact;
            
            return {
                date: transaction.date,
                transactionNumber: transaction.transactionNumber,
                type: transaction.type,
                total: transaction.total,
                impact: impact,
                balance: runningBalance,
                formattedBalance: this.formatBalanceWithSign(runningBalance, partyType)
            };
        });
        
        return {
            partyId,
            partyType,
            startDate,
            endDate,
            openingBalance: transactions.length > 0 ? transactions[0].balanceTracking?.previousBalance : 0,
            closingBalance: runningBalance,
            transactions: statement
        };
    }

    /**
     * Get comprehensive dashboard data
     */
    async getDashboardData(tenantId, storeId) {
        const balances = await prisma.partyBalance.findMany({ 
            where: { tenantId, storeId, deletedAt: null } 
        });
        
        const customers = balances.filter(b => b.partyType === 'CUSTOMER');
        const suppliers = balances.filter(b => b.partyType === 'SUPPLIER');

        const totalReceivables = customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
        const totalPayables = suppliers.reduce((sum, s) => sum + (s.currentBalance < 0 ? Math.abs(s.currentBalance) : 0), 0);

        return {
            receivables: {
                total: totalReceivables,
                formatted: `+$${totalReceivables.toFixed(2)}`
            },
            payables: {
                total: totalPayables,
                formatted: `-$${totalPayables.toFixed(2)}`
            },
            customerCount: customers.length,
            supplierCount: suppliers.length
        };
    }

    /**
     * Update aging report for receivables/payables
     */
    async updateAgingReport(tenantId, storeId, partyId, partyType, currentBalance, tx) {
        // Implementation logic for calculating aging based on unpaid transaction dates
        // This usually runs as a background job or on-demand for specific reports
        // For now, we stub it as a placeholder as per user schema
        return true;
    }

    async getTransactions(tenantId, storeId, options = {}) {
        return await transactionRepository.findByTenant(tenantId, storeId, options);
    }
}

module.exports = new TransactionService();
