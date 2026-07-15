const prisma = require('../config/prisma');
const expenseRepository = require('../repositories/expense.repository');
const ApiError = require('../utils/ApiError');

class ExpenseService {
    async createExpense(expenseData, tenantId, userId) {
        return await prisma.$transaction(async (tx) => {
            let categoryId = expenseData.categoryId;
            if (expenseData.category) {
                let categoryObj = await tx.expenseCategory.findFirst({
                    where: { tenantId, name: expenseData.category }
                });
                if (!categoryObj) {
                    categoryObj = await tx.expenseCategory.create({
                        data: { tenantId, name: expenseData.category }
                    });
                }
                categoryId = categoryObj.id;
            }

            const { category, date, ...restData } = expenseData;

            const expense = await expenseRepository.create({
                ...restData,
                categoryId: categoryId,
                expenseDate: date ? new Date(date) : new Date(),
                paymentMethod: expenseData.paymentMethod || 'CASH',
                tenantId,
                createdById: userId
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
