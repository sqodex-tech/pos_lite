const prisma = require('../config/prisma');
const expenseRepository = require('../repositories/expense.repository');
const ApiError = require('../utils/ApiError');

class ExpenseService {
    async createExpense(expenseData, tenantId, userId) {
        return await prisma.$transaction(async (tx) => {
            const expense = await expenseRepository.create({
                ...expenseData,
                tenantId,
                createdBy: userId
            }, tx);

            if (expense.paymentMethod === 'CASH') {
                await tx.cashLedger.create({
                    data: {
                        tenantId,
                        storeId: expense.storeId,
                        userId,
                        amount: expense.amount,
                        type: 'OUT',
                        referenceType: 'EXPENSE',
                        referenceId: expense.id,
                        description: `Expense: ${expense.description || 'General'}`
                    }
                });
            }

            return expense;
        });
    }

    async getExpenses(tenantId, options = {}) {
        return await expenseRepository.findByTenant(tenantId, options);
    }
}

module.exports = new ExpenseService();
