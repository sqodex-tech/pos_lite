const expenseRepository = require('../repositories/expense.repository');
const expenseService = require('../services/expense.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache.service');
const prisma = require('../config/prisma');

const createExpense = async (req, res, next) => {
    try {
        const expense = await expenseService.createExpense(req.body, req.tenantId, req.user.id);
        cache.delStartWith(`expenses_${req.tenantId}`);
        return res.status(201).json(new ApiResponse(201, expense, 'Expense recorded successfully'));
    } catch (error) {
        next(error);
    }
};

const getExpenses = async (req, res, next) => {
    try {
        const { storeId, categoryId, startDate, endDate, page = 1, limit = 20 } = req.query;
        const cacheKey = `expenses_${req.tenantId}_${storeId || ''}_${categoryId || ''}_${startDate || ''}_${endDate || ''}_${page}_${limit}`;

        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            const mappedCached = cachedData.expenses.map(e => ({
                _id: e.id,
                description: e.description,
                amount: e.amount,
                category: e.category?.name || 'General',
                date: e.expenseDate,
                storeId: e.storeId,
                createdBy: e.createdById,
                status: e.status || 'COMPLETED'
            }));
            return res.status(200).json(new ApiResponse(200, mappedCached, 'Expenses fetched successfully (cached)', cachedData.meta));
        }

        const result = await expenseRepository.findByTenant(req.tenantId, {
            storeId, categoryId, startDate, endDate, page: parseInt(page), limit: parseInt(limit)
        });

        const totalPages = Math.ceil(result.total / result.limit);
        const meta = {
            total: result.total,
            page: result.page,
            totalPages,
            hasMore: result.page < totalPages
        };

        cache.set(cacheKey, { expenses: result.expenses, meta });

        const mappedExpenses = result.expenses.map(e => ({
            _id: e.id,
            description: e.description,
            amount: e.amount,
            category: e.category?.name || 'General',
            date: e.expenseDate,
            storeId: e.storeId,
            createdBy: e.createdById,
            status: e.status || 'COMPLETED'
        }));

        return res.status(200).json(new ApiResponse(200, mappedExpenses, 'Expenses fetched successfully', meta));
    } catch (error) {
        next(error);
    }
};

const getExpenseById = async (req, res, next) => {
    try {
        const expense = await expenseRepository.findById(req.tenantId, req.params.id);
        if (!expense) throw new ApiError(404, 'Expense not found');

        return res.status(200).json(new ApiResponse(200, expense, 'Expense fetched successfully'));
    } catch (error) {
        next(error);
    }
};

const deleteExpense = async (req, res, next) => {
    try {
        const expense = await expenseRepository.delete(req.tenantId, req.params.id);
        if (!expense) throw new ApiError(404, 'Expense not found');

        cache.delStartWith(`expenses_${req.tenantId}`);
        return res.status(200).json(new ApiResponse(200, null, 'Expense deleted successfully'));
    } catch (error) {
        next(error);
    }
};

const getExpenseSummary = async (req, res, next) => {
    try {
        const { storeId, categoryId, startDate, endDate } = req.query;
        
        // Build match query
        const where = { tenantId: req.tenantId, deletedAt: null };
        if (storeId) where.storeId = storeId;
        if (categoryId) where.categoryId = categoryId;
        if (startDate || endDate) {
            where.expenseDate = {};
            if (startDate) where.expenseDate.gte = new Date(startDate);
            if (endDate) where.expenseDate.lte = new Date(endDate);
        }

        // Total expenses
        const totalResult = await prisma.expense.aggregate({
            where,
            _sum: { amount: true },
            _count: true
        });

        // By category
        const byCategoryGroup = await prisma.expense.groupBy({
            by: ['categoryId'],
            where,
            _sum: { amount: true },
            _count: true,
            orderBy: { _sum: { amount: 'desc' } }
        });

        const categories = await prisma.expenseCategory.findMany({
            where: { id: { in: byCategoryGroup.map(c => c.categoryId).filter(Boolean) } }
        });
        const categoryMap = categories.reduce((acc, cat) => { acc[cat.id] = cat.name; return acc; }, {});

        const byCategory = byCategoryGroup.map(c => ({
            categoryId: c.categoryId,
            category: c.categoryId ? (categoryMap[c.categoryId] || 'Unknown') : 'Uncategorized',
            amount: c._sum.amount || 0,
            count: c._count
        }));

        // By payment method
        const byPaymentMethodGroup = await prisma.expense.groupBy({
            by: ['paymentMethod'],
            where,
            _sum: { amount: true },
            _count: true,
            orderBy: { _sum: { amount: 'desc' } }
        });

        const byPaymentMethod = byPaymentMethodGroup.map(p => ({
            method: p.paymentMethod,
            amount: p._sum.amount || 0,
            count: p._count
        }));

        // By store (if not filtered by single store)
        let byStore = [];
        if (!storeId) {
            const byStoreGroup = await prisma.expense.groupBy({
                by: ['storeId'],
                where,
                _sum: { amount: true },
                _count: true,
                orderBy: { _sum: { amount: 'desc' } }
            });

            const stores = await prisma.store.findMany({
                where: { id: { in: byStoreGroup.map(s => s.storeId).filter(Boolean) } }
            });
            const storeMap = stores.reduce((acc, st) => { acc[st.id] = st.name; return acc; }, {});

            byStore = byStoreGroup.map(s => ({
                storeId: s.storeId,
                store: s.storeId ? (storeMap[s.storeId] || 'Unknown') : 'Unknown',
                amount: s._sum.amount || 0,
                count: s._count
            }));
        }

        const summary = {
            totalExpenses: totalResult._sum.amount || 0,
            totalCount: totalResult._count || 0,
            byCategory,
            byPaymentMethod,
            byStore
        };

        return res.status(200).json(new ApiResponse(200, summary, 'Expense summary fetched successfully'));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createExpense,
    getExpenses,
    getExpenseById,
    deleteExpense,
    getExpenseSummary
};
